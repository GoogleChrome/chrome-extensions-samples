chrome.action.onClicked.addListener(async () => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  const canvas = new OffscreenCanvas(256, 256);
  const context = canvas.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format });

  const code = `
      @vertex fn vertexMain(@builtin(vertex_index) i : u32) ->
      @builtin(position) vec4f {
      const pos = array(vec2f(0, 1), vec2f(-1, -1), vec2f(1, -1));
      return vec4f(pos[i], 0, 1);
      }
      @fragment fn fragmentMain() -> @location(0) vec4f {
      return vec4f(1, 0, 0, 1);
      }`;
  const module = device.createShaderModule({ code });
  const pipeline = await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: { module },
    fragment: { module, targets: [{ format }] }
  });
  const commandEncoder = device.createCommandEncoder();
  const colorAttachments = [
    {
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      storeOp: 'store'
    }
  ];
  const passEncoder = commandEncoder.beginRenderPass({ colorAttachments });
  passEncoder.setPipeline(pipeline);
  passEncoder.draw(3);
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);

  // Open canvas as an image in a new tab.
  const blob = await canvas.convertToBlob();
  const reader = new FileReader();
  reader.onload = () => chrome.tabs.create({ url: reader.result });
  reader.readAsDataURL(blob);
});
