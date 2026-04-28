import { remoteTravelStoreRepository } from '../../lib/repositories/remoteTravelStoreRepository';
import type { UserProfile } from '../../types';
import type { UseTravelStoreActionsArgs } from './useTravelStoreActions';

/**
 * Companion-domain actions extracted from the monolithic store actions hook.
 * 旅伴域动作：从原来的大一统 hook 中拆出，单独负责当前用户切换与新增旅伴。
 */
export function useCompanionActions({ store, setStore, showToast }: UseTravelStoreActionsArgs) {
  const activeUser = store.users.find((item) => item.id === store.activeUserId) ?? store.users[0];

  const handleSwitchUser = (userId: string) => {
    setStore((current) => ({ ...current, activeUserId: userId }));
    const user = store.users.find((item) => item.id === userId);
    if (user) {
      showToast(`当前记录用户已切换为 ${user.name}。`, 'success');
    }
  };

  const handleCreateUser = async ({ name, color }: { name: string; color: string }) => {
    try {
      const nextStore = await remoteTravelStoreRepository.createCompanion({ name, color });
      const nextUser = nextStore.users.find((item) => item.name === name && item.color === color) ?? nextStore.users[0];

      setStore({
        ...nextStore,
        activeUserId: nextUser?.id ?? nextStore.activeUserId,
      });
      showToast(`已新增用户 ${name}，现在可以使用该用户记录旅行。`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '新增用户失败，请稍后重试。', 'error');
    }
  };

  return {
    activeUser: activeUser as UserProfile | undefined,
    handleSwitchUser,
    handleCreateUser,
  };
}
