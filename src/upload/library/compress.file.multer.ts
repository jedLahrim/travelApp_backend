import * as zlib from "zlib";
import * as fs from "fs";
export class Library {
  //todo compress the file
  static COMPRESS_FILE(buffer: Buffer): Buffer {
    // Compress the file using zlib
    const compressedBuffer = zlib.deflateSync(buffer);
    return compressedBuffer;
  }
  //todo decompress the file

  static DECOMPRESS_FILE(buffer: Buffer): Buffer {
    // Decompress the compressed buffer using zlib
    const decompressedBuffer = zlib.inflateSync(buffer);
    return decompressedBuffer;
  }
}
