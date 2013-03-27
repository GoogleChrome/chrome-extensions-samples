var canvas = document.getElementsByTagName('canvas')[0];
var ctx = canvas.getContext('2d');
ctx.roundedRect = function (left, top, width, height, radius, offset) {
  offset = offset || 0;
  if (width < 0) {
    left += width;
    width = -width;
  }
  if (height < 0) {
    top += height;
    height = -height;
  }
  left += offset;
  top += offset;
  width -= offset * 2;
  height -= offset * 2;
  radius -= offset;
  radius = Math.min(radius, Math.min(width, height) / 2);

  this.moveTo(left + radius, top);
  this.lineTo(left + width - radius, top);
  this.arcTo(left + width, top, left + width, top + radius, radius);
  this.lineTo(left + width, top + height - radius);
  this.arcTo(left + width, top + height, left, top + height, radius);
  this.lineTo(left + radius, top + height);
  this.arcTo(left, top + height, left, top, radius);
  this.lineTo(left, top + radius);
  this.arcTo(left, top, left + radius, top, radius);
  this.closePath();
};

ctx.drawArrow = function (length, width, bleed) {
  var hw = width / 2;
  ctx.moveTo(0, hw);
  ctx.lineTo(length - bleed - hw, hw);
  ctx.lineTo(length - bleed - hw, hw + bleed);
  ctx.lineTo(length, 0);
  ctx.lineTo(length - bleed - hw, -hw - bleed);
  ctx.lineTo(length - bleed - hw, -hw);
  ctx.lineTo(0, -hw);
  ctx.closePath();
};
{
  ctx.save();
  ctx.beginPath();
  ctx.roundedRect(0, 0, 128, 128, 25, 9.5);
  var grad = ctx.createLinearGradient(0, 0, 90, 128);
  grad.addColorStop(0, '#fac695');
  grad.addColorStop(0.5, '#f5ab66');
  grad.addColorStop(1, '#ef8d31');
  ctx.fillStyle = grad;
  ctx.shadowBlur = 2;
  ctx.shadowColor = '#999';
  ctx.shadowOffsetX = 0.5;
  ctx.shadowOffsetY = 0.5;
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.globalAlpha = 0.3;
  ctx.stroke();
  ctx.restore();
}
{
  ctx.save();
  ctx.translate(64, 64);
  ctx.fillStyle = 'white';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 1;
  ctx.shadowColor = '#000';
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#333';
  ctx.beginPath();
  for (var angle = 1; angle < 12; angle += 2) {
    ctx.save();
    if (Math.random() < 1) {
      ctx.rotate((angle) * Math.PI / 12);
      ctx.translate(35 + Math.random() * 10, 0);
    } else {
      ctx.rotate((angle) * Math.PI / 12 + Math.PI);
      ctx.translate(-22 - 35 - Math.random() * 10, 0);
    }

    ctx.drawArrow(22, 12, 5);
    ctx.restore();
  }

  ctx.fill();
  ctx.shadowColor = 'none';
  ctx.stroke();
  {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 29.6, 0, Math.PI * 2, false);
    ctx.fillStyle = 'white';
    ctx.shadowBlur = 1;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 0.5;
    ctx.shadowOffsetY = 1;
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2, false);
  ctx.moveTo(-12, -3);
  ctx.arc(0, 2, 13, Math.atan(-5 / 12), Math.atan(5 / 12) + Math.PI, false);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#FFB601';
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.save();
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, 0, 29.6, 0, Math.PI * 2, false);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
var url = canvas.toDataURL('image/png');

document.writeln('<a href="' + url + '">' + url + '<a/>');


