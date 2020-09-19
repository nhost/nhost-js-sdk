export type StringFormat = string;
export const StringFormat = {
  RAW: "raw",
  BASE64: "base64",
  BASE64URL: "base64url",
  DATA_URL: "data_url",
};

export function base64Bytes(format: StringFormat, value: string): Uint8Array {
  switch (format) {
    case StringFormat.BASE64: {
      const hasMinus = value.indexOf("-") !== -1;
      const hasUnder = value.indexOf("_") !== -1;
      if (hasMinus || hasUnder) {
        const invalidChar = hasMinus ? "-" : "_";
        throw `Invalid character '${invalidChar}' found: is it base64url encoded?`;
      }
      break;
    }
    case StringFormat.BASE64URL: {
      const hasPlus = value.indexOf("+") !== -1;
      const hasSlash = value.indexOf("/") !== -1;
      if (hasPlus || hasSlash) {
        const invalidChar = hasPlus ? "+" : "/";
        throw `Invalid character '${invalidChar}' found: is it base64url encoded?`;
      }
      value = value.replace(/-/g, "+").replace(/_/g, "/");
      break;
    }
    default:
    // do nothing
  }
  let bytes;
  try {
    bytes = atob(value);
  } catch (e) {
    throw `Invalid character found`;
  }
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    array[i] = bytes.charCodeAt(i);
  }
  return array;
}

export function utf8Bytes(value: string): Uint8Array {
  const b: number[] = [];
  for (let i = 0; i < value.length; i++) {
    let c = value.charCodeAt(i);
    if (c <= 127) {
      b.push(c);
    } else {
      if (c <= 2047) {
        b.push(192 | (c >> 6), 128 | (c & 63));
      } else {
        if ((c & 64512) === 55296) {
          // The start of a surrogate pair.
          const valid =
            i < value.length - 1 && (value.charCodeAt(i + 1) & 64512) === 56320;
          if (!valid) {
            // The second surrogate wasn't there.
            b.push(239, 191, 189);
          } else {
            const hi = c;
            const lo = value.charCodeAt(++i);
            c = 65536 | ((hi & 1023) << 10) | (lo & 1023);
            b.push(
              240 | (c >> 18),
              128 | ((c >> 12) & 63),
              128 | ((c >> 6) & 63),
              128 | (c & 63)
            );
          }
        } else {
          if ((c & 64512) === 56320) {
            // Invalid low surrogate.
            b.push(239, 191, 189);
          } else {
            b.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
          }
        }
      }
    }
  }
  return new Uint8Array(b);
}

export function percentEncodedBytes(value: string): Uint8Array {
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch (e) {
    throw "Malformed data URL.";
  }
  return utf8Bytes(decoded);
}
