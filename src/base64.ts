const code =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const lookup = [] as string[]
// url safe support 
const revLookup = {
  '-': 62,
  '_': 63
} as Record<string,number>

for (let i = 0, len = code.length; i < len; i++) {
  lookup[i] = code[i]
  revLookup[code[i]] = i
}

/**
 * 将base64字符串转换为uint8Array
 *
 * @param {string} base64 待转换的base64字符串
 */
function base64ToUint8Array(base64:string) {
  return new Uint8Array(Array.from(window.atob(base64)).map(char => char.charCodeAt(0)))
}

/**
 * 将uint8Array转换为base64字符串
 *
 * @param {Uint8Array} uint8Array 待转换的uint8Array
 */
function uint8ArrayToBase64(uint8Array:Uint8Array) {
  return window.btoa(Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join(''))
}

/**
 * 将标准的base64字符串转换为urlSafe的字符串
 *
 * 将+替换为-
 * 将/替换为_
 * 移除末尾的=
 *
 * @param {string} base64 标准的base64字符串
 */
function base64urlEncode(base64: string) {
  return base64.replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * 将urlSafe的base64字符串转换为标准的字符串
 *
 * 将-替换回+
 * 将_替换回/
 * 添加末尾的=
 *
 * @param {string} base64 urlSafe的base64字符串
 */
function base64urlDecode(base64: string) {
  const padding = "=".repeat(getPaddingLength(base64));
  const base64String = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");

  return base64String;
}

/**
 * 检查输入的内容是否为有效的base64字符串
 *
 * @param {any} source 待检查的内容
 */
function isValidBase64String(source: any) {
  if (typeof source !== 'string') {
    return false
  }
  const string = source.replace(/\s+/g, '').replace(/={0,2}$/, '');
  return !/[^\s0-9a-zA-Z+/]/.test(string) || !/[^\s0-9a-zA-Z\-_]/.test(string);
}

/**
 * 获取base64字符串填充长度
 *
 * @param {string} base64 输入的base64字符串
 */
function getPaddingLength(base64: string) {
  return (4 - (base64.length % 4)) % 4;
}

/**
 * 获取base64字符串对应的字节长度
 *
 * @param {string} base64 输入的base64字符串
 */
function getByteLength(base64: string) {
  const paddingLength = getPaddingLength(base64)
  const padding = '='.repeat(paddingLength)
  return (base64 + padding).length * 3 / 4 - paddingLength
}

/**
 * 将base64字符串解析为原始字符串
 *
 * @param {string} base64 待解析的base64字符串
 */
export function decodeBase64(base64: string, urlSafe:boolean = false) {
  if (!isValidBase64String(base64)) {
    throw new Error('Invalid base64 string')
  }
  if (urlSafe) {
    base64 = base64urlDecode(base64)
  }
  const arrayBuffer = base64ToUint8Array(base64)
  const decoder = new TextDecoder()
  return decoder.decode(arrayBuffer)
}

/**
 * 将原始字符串编码为base64字符串
 *
 * @param {string} string 待编码的原始字符串
 */
export function encodeBase64(string: string, urlSafe:boolean = false) {
  const encoder = new TextEncoder()
  const arrayBuffer = encoder.encode(string)
  const base64 = uint8ArrayToBase64(arrayBuffer)
  if (urlSafe) {
    return base64urlEncode(base64)
  }
  return base64
}

/**
 * 获取base64字符串的配置信息
 *
 * @param {string} base64 base64字符串
 */
export function getBase64Info(base64: string) {
  if (!isValidBase64String(base64)) {
    throw new Error('Invalid base64 string')
  }
  const length = base64.length
  // 长度不符合规范需要填充内容
  if (length % 4 > 0) {
    const paddingLength = getPaddingLength(base64)
    base64+='='.repeat(paddingLength)
  }
  const index = base64.indexOf('=')
  const validLength = index > 0 ? index : base64.length
  const paddingString = index > 0 ? base64.slice(index) : ''
  const validString = base64.slice(0,validLength)
  const urlSafeString = base64urlEncode(base64)
  const normalString = base64urlDecode(base64)
  return {
    /** 有效字符串 */
    validString,
    /** 有效字符串长度 */
    validLength,
    /** 填充字符串 */
    paddingString,
    /** 填充字符串长度 */
    paddingLength: paddingString.length,
    /** 给定字符串是否为urlSafe字符串*/
    isUrlSafe: base64 === urlSafeString,
    /** 给定字符串是否为标准字符串 */
    isNormal: base64 === normalString,
    /** urlSafe字符串 */
    urlSafeString,
    /** 标准字符串 */
    normalString
  }
}

/**
 * 将uint8Array转换为base64字符串
 *
 * @param {Uint8Array} uint8Array 待转换的的uint8Array
 */
export function fromUint8Array(uint8Array: Uint8Array) {
  const len = uint8Array.length;
  const extraBytes = len % 3;
  const forLen = len - extraBytes;
  const parts = [];
  let tmp;
  // 每次循环处理三个字节的内容
  for (let i = 0; i < forLen; i += 3) {
    tmp = (uint8Array[i] << 16) | (uint8Array[i + 1] << 8) | uint8Array[i + 2];
    parts.push(
      lookup[(tmp >> 18) & 0x3f] +
        lookup[(tmp >> 12) & 0x3f] +
        lookup[(tmp >> 6) & 0x3f] +
        lookup[tmp & 0x3f],
    );
  }
  // 补齐末尾的等号
  if (extraBytes === 1) {
    tmp = uint8Array[len - 1];
    parts.push(lookup[tmp >> 2] + lookup[(tmp << 4) & 0x3f] + "==");
  } else if (extraBytes === 2) {
    tmp = (uint8Array[len - 2] << 8) + uint8Array[len - 1];
    parts.push(
      lookup[tmp >> 10] +
        lookup[(tmp >> 4) & 0x3f] +
        lookup[(tmp << 2) & 0x3f] +
        "=",
    );
  }

  return parts.join("");
}

/**
 * 将base64字符串转换为Uint8Array
 *
 * @param {string} base64 待转换的base64字符串
 */
export function toUint8Array(base64: string) {
  const { validLength, paddingLength } = getBase64Info(base64);
  const byteLength = getByteLength(base64);
  const uint8Array = new Uint8Array(byteLength);
  const len = Math.min(validLength / 4);
  let currentByte = 0;
  let i = 0;
  let tmp;

  for (; i < len; i += 4) {
    tmp =
      (revLookup[base64[i]] << 18) |
      (revLookup[base64[i + 1]] << 12) |
      (revLookup[base64[i + 2]] << 6) |
      revLookup[base64[i + 3]];
    uint8Array[currentByte++] = (tmp >> 16) & 0xff;
    uint8Array[currentByte++] = (tmp >> 8) & 0xff;
    uint8Array[currentByte++] = tmp & 0xff;
  }

  if (paddingLength === 2) {
    tmp = (revLookup[base64[i]] << 2) | (revLookup[base64[i + 1]] >> 4);
    uint8Array[currentByte++] = tmp & 0xff;
  }

  if (paddingLength === 1) {
    tmp =
      (revLookup[base64[i]] << 10) |
      (revLookup[base64[i + 1]] << 4) |
      (revLookup[base64[i + 2]] >> 2);
    uint8Array[currentByte++] = (tmp >> 8) & 0xff;
    uint8Array[currentByte++] = tmp & 0xff;
  }

  return uint8Array;
}
