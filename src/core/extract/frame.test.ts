import { describe, expect, it } from "vitest";
import { frameBatchExecute, frameSse } from "./frame";

describe("frameSse", () => {
    it("parses `data: {...}` lines into frames with their JSON", () => {
        const text = ['data: {"a":1}', "data: [DONE]", "", "ignored plain text"].join("\n");
        const frames = frameSse(text);
        expect(frames).toHaveLength(1);
        expect(frames[0].json).toEqual({ a: 1 });
    });

    it("accepts a bare top-level JSON line as a non-SSE fallback", () => {
        const frames = frameSse('{"long_enough_key": "value exceeding twenty chars"}');
        expect(frames).toHaveLength(1);
        expect(frames[0].json).toMatchObject({ long_enough_key: expect.any(String) });
    });

    it("keeps a truncated chunk as a frame with json undefined instead of dropping it", () => {
        const frames = frameSse('data: {"a": truncated-garbage-that-is-long-enough');
        expect(frames).toHaveLength(1);
        expect(frames[0].json).toBeUndefined();
        expect(frames[0].raw).toContain("truncated-garbage");
    });
});

describe("frameBatchExecute", () => {
    it("strips the XSSI prefix and splits on the length-delimited part boundary", () => {
        const text = `)]}'\n15\n${JSON.stringify({ a: 1 })}\n`;
        const frames = frameBatchExecute(text);
        expect(frames).toHaveLength(1);
        expect(frames[0].json).toEqual({ a: 1 });
    });

    it("recovers JSON from a part that has noise around it via the loose bracket match", () => {
        const text = `)]}'\n99\nwrapper-noise-before${JSON.stringify([1, 2, 3])}wrapper-noise-after\n`;
        const frames = frameBatchExecute(text);
        expect(frames[0].json).toEqual([1, 2, 3]);
    });
});
