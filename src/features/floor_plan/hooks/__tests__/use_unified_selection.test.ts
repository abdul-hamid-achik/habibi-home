import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnifiedSelection, useSelectionEventHandlers } from '../use_unified_selection';
import { useSelectionStore } from '../../state/selection_store';

// Mock window.dispatchEvent
global.window.dispatchEvent = vi.fn();
global.window.addEventListener = vi.fn();
global.window.removeEventListener = vi.fn();
global.document.addEventListener = vi.fn();
global.document.removeEventListener = vi.fn();

describe('useUnifiedSelection', () => {
  beforeEach(() => {
    // Reset store before each test
    useSelectionStore.getState().clearSelection();
    vi.clearAllMocks();
  });

  it('should select items correctly', () => {
    const { result } = renderHook(() => useUnifiedSelection());

    act(() => {
      result.current.selectItem('zone1', 'zone');
    });

    expect(result.current.selectedItems).toHaveLength(1);
    expect(result.current.selectedItems[0]).toEqual({ id: 'zone1', type: 'zone' });
    expect(result.current.activeSelection).toEqual({ id: 'zone1', type: 'zone' });
  });

  it('should handle multi-selection', () => {
    const { result } = renderHook(() => useUnifiedSelection());

    act(() => {
      result.current.selectItem('zone1', 'zone');
    });

    act(() => {
      result.current.addToSelection('furniture1', 'furniture');
    });

    expect(result.current.selectedItems).toHaveLength(2);
    expect(result.current.isMultiSelectMode).toBe(true);
    expect(result.current.getSelectedCount()).toBe(2);
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useUnifiedSelection());

    act(() => {
      result.current.selectItem('zone1', 'zone');
    });

    expect(result.current.hasSelection()).toBe(true);

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.hasSelection()).toBe(false);
    expect(result.current.selectedItems).toHaveLength(0);
  });

  it('should filter items by type', () => {
    const { result } = renderHook(() => useUnifiedSelection());

    act(() => {
      result.current.selectMultipleItems([
        { id: 'zone1', type: 'zone' },
        { id: 'furniture1', type: 'furniture' },
        { id: 'zone2', type: 'zone' },
      ]);
    });

    const zones = result.current.getSelectedItemsByType('zone');
    const furniture = result.current.getSelectedItemsByType('furniture');

    expect(zones).toHaveLength(2);
    expect(furniture).toHaveLength(1);
  });

  it('should toggle selection', () => {
    const { result } = renderHook(() => useUnifiedSelection());

    // Toggle on
    act(() => {
      result.current.toggleSelection('zone1', 'zone');
    });

    expect(result.current.isSelected('zone1')).toBe(true);

    // Toggle off
    act(() => {
      result.current.toggleSelection('zone1', 'zone');
    });

    expect(result.current.isSelected('zone1')).toBe(false);
  });

  it('should emit delete events', () => {
    const { result } = renderHook(() => useUnifiedSelection());

    act(() => {
      result.current.selectMultipleItems([
        { id: 'zone1', type: 'zone' },
        { id: 'furniture1', type: 'furniture' },
      ]);
    });

    act(() => {
      result.current.deleteSelected();
    });

    // Check that events were dispatched
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'zone:delete',
        detail: { id: 'zone1' }
      })
    );

    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'furniture:delete',
        detail: { id: 'furniture1' }
      })
    );

    // Selection should be cleared after delete
    expect(result.current.hasSelection()).toBe(false);
  });

  it('should emit duplicate events', () => {
    const { result } = renderHook(() => useUnifiedSelection());

    act(() => {
      result.current.selectItem('diagram1', 'diagram');
    });

    act(() => {
      result.current.duplicateSelected();
    });

    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'diagram:duplicate',
        detail: { id: 'diagram1' }
      })
    );
  });
});

describe('useSelectionEventHandlers', () => {
  it('should register and call event handlers', () => {
    const onZoneDelete = vi.fn();
    const onFurnitureDuplicate = vi.fn();

    renderHook(() => useSelectionEventHandlers({
      onZoneDelete,
      onFurnitureDuplicate,
    }));

    // Verify event listeners were registered
    expect(window.addEventListener).toHaveBeenCalledWith('zone:delete', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('furniture:duplicate', expect.any(Function));
  });
});