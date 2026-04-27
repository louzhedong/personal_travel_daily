import { useCallback, useState } from 'react';
import type { TripCollection } from '../../types';

/**
 * UI state hook for trip timeline dialog actions.
 * 行程时间线对话框/批量整理的 UI 状态 hook，
 * 承接创建、编辑、删除行程以及批量归属对话框的本地 state。
 */

export type TripDialogMode = 'create' | 'edit' | null;

export interface TripFormState {
  name: string;
  startsAt: string;
  endsAt: string;
  note: string;
}

export interface TripTimelineActionsResult {
  // 对话框模式（创建/编辑/关闭） / dialog mode
  tripDialogMode: TripDialogMode;
  // 正在编辑的行程 id / editing trip id
  editingTripId: string | null;
  // 表单字段 / form fields
  tripName: string;
  tripStartsAt: string;
  tripEndsAt: string;
  tripNote: string;
  setTripName: (value: string) => void;
  setTripStartsAt: (value: string) => void;
  setTripEndsAt: (value: string) => void;
  setTripNote: (value: string) => void;
  // 是否允许提交 / whether submit is enabled
  canSubmitTrip: boolean;
  // 打开/关闭对话框 / open & close dialog
  openCreateTripDialog: () => void;
  openEditTripDialog: (trip: TripCollection) => void;
  closeTripDialog: () => void;
  // 待删除行程 / pending deletion trip id
  pendingDeleteTripId: string | null;
  setPendingDeleteTripId: (id: string | null) => void;
  // 整理模式 / selection (batch) mode
  selectionMode: boolean;
  selectedMarkerIds: string[];
  setSelectedMarkerIds: (updater: (current: string[]) => string[]) => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleMarkerSelection: (markerId: string) => void;
  // 批量归属目标 / batch target trip id
  batchTripTarget: string;
  setBatchTripTarget: (value: string) => void;
}

export function useTripTimelineActions(): TripTimelineActionsResult {
  // 表单/对话框状态 / form & dialog states
  const [tripDialogMode, setTripDialogMode] = useState<TripDialogMode>(null);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [tripName, setTripName] = useState('');
  const [tripStartsAt, setTripStartsAt] = useState('');
  const [tripEndsAt, setTripEndsAt] = useState('');
  const [tripNote, setTripNote] = useState('');
  const [pendingDeleteTripId, setPendingDeleteTripId] = useState<string | null>(null);

  // 整理模式状态 / selection mode states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMarkerIds, setSelectedMarkerIdsState] = useState<string[]>([]);
  const [batchTripTarget, setBatchTripTarget] = useState('');

  // 校验提交条件 / validate submit
  const canSubmitTrip =
    tripName.trim().length > 0 && !!tripStartsAt && !!tripEndsAt && tripEndsAt >= tripStartsAt;

  // 重置表单 / reset form
  const resetTripForm = () => {
    setTripName('');
    setTripStartsAt('');
    setTripEndsAt('');
    setTripNote('');
    setEditingTripId(null);
  };

  const closeTripDialog = () => {
    resetTripForm();
    setTripDialogMode(null);
  };

  const openCreateTripDialog = () => {
    resetTripForm();
    setTripDialogMode('create');
  };

  const openEditTripDialog = (trip: TripCollection) => {
    setEditingTripId(trip.id);
    setTripName(trip.name);
    setTripStartsAt(trip.startsAt);
    setTripEndsAt(trip.endsAt);
    setTripNote(trip.note);
    setTripDialogMode('edit');
  };

  // 进入/退出整理模式 / enter & exit selection mode
  const enterSelectionMode = () => {
    setSelectionMode(true);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMarkerIdsState([]);
    setBatchTripTarget('');
  };

  const toggleMarkerSelection = (markerId: string) => {
    setSelectedMarkerIdsState((current) =>
      current.includes(markerId) ? current.filter((item) => item !== markerId) : [...current, markerId],
    );
  };

  // 允许外部按函数式 updater 更新选择集（用于可见集合同步） / external functional update
  const setSelectedMarkerIds = useCallback((updater: (current: string[]) => string[]) => {
    setSelectedMarkerIdsState((current) => updater(current));
  }, []);

  return {
    tripDialogMode,
    editingTripId,
    tripName,
    tripStartsAt,
    tripEndsAt,
    tripNote,
    setTripName,
    setTripStartsAt,
    setTripEndsAt,
    setTripNote,
    canSubmitTrip,
    openCreateTripDialog,
    openEditTripDialog,
    closeTripDialog,
    pendingDeleteTripId,
    setPendingDeleteTripId,
    selectionMode,
    selectedMarkerIds,
    setSelectedMarkerIds,
    enterSelectionMode,
    exitSelectionMode,
    toggleMarkerSelection,
    batchTripTarget,
    setBatchTripTarget,
  };
}
