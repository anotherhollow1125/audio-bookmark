// 俺「誰だutil.tsとかいうふざけたファイル作ったやつ」
// 俺「許せねー」
// 俺「お前じゃい」

// ...オーディオのIDを見やすくする関数をおいておくためにとりあえず作りました

// 0.01234 -> 1
// 0.015 -> 2
// 0.012 -> 1
// 0.019 -> 2
export function volFloat2Int(num: number): number {
  return Math.round(num * 100);
}

// 0.01234 -> "1"
// 0.015 -> "2"
// 0.012 -> "1"
// 0.019 -> "2"
export function volFloat2Str(num: number): string {
  return volFloat2Int(num).toFixed();
}

// 1 -> 0.01
// 2 -> 0.02
// 3 -> 0.03
export function volInt2Float(num: number): number {
  return num / 100;
}

export function getNeatID(id: string): string {
  return id.replace(/^{.*}\.{(.*)}$/, "$1");
}