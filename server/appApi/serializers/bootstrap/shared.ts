// bootstrap serializer 共享工具 / Shared helpers for bootstrap serializer sub-modules.
// 被 companions / trips / markers / guides 子模块共同使用。
// Consumed across companions / trips / markers / guides sub-modules.
export function toIsoString(value: Date): string {
  return value.toISOString();
}

export function toDateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10);
}
