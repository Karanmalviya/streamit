export type FocusableElement = {
  focus?: () => void;
  blur?: () => void;
  getNodeHandle?: () => number | null;
} | null;

export type FocusedLocationType = 'billboard' | 'sidebar' | 'content';

export interface FocusedItemInfo {
  type: FocusedLocationType;
  railId?: string;
  index?: number;
  tab?: string;
  ref?: FocusableElement;
}

class TVNavigationService {
  private sidebarTabs: Record<string, FocusableElement> = {};
  private activeTab: string = 'home';
  private lastFocusedContent: FocusableElement = null;
  private billboardWatchNow: FocusableElement = null;
  private firstRailFirstItem: FocusableElement = null;

  private currentFocus: FocusedItemInfo | null = null;
  private activeFocusRef: FocusableElement = null;
  private isModalOpen: boolean = false;

  setModalOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  getIsModalOpen(): boolean {
    return this.isModalOpen;
  }

  // Global single-focus coordinator: ensures only one element can be focused at a time
  setActiveFocus(ref: FocusableElement) {
    if (this.activeFocusRef && this.activeFocusRef !== ref) {
      try {
        this.activeFocusRef.blur?.();
      } catch {}
    }
    this.activeFocusRef = ref;
  }

  getActiveFocus(): FocusableElement {
    return this.activeFocusRef;
  }

  registerSidebarTab(tab: string, ref: FocusableElement) {
    if (ref) {
      this.sidebarTabs[tab] = ref;
    }
  }

  unregisterSidebarTab(tab: string) {
    delete this.sidebarTabs[tab];
  }

  setActiveTab(tab: string) {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      this.lastFocusedContent = null;
    }
  }

  registerBillboardWatchNow(ref: FocusableElement) {
    this.billboardWatchNow = ref;
  }

  registerFirstRailFirstItem(ref: FocusableElement) {
    this.firstRailFirstItem = ref;
  }

  setLastFocusedContent(ref: FocusableElement) {
    this.lastFocusedContent = ref;
  }

  // Tracking focused element
  setFocusedContent(railId: string, index: number, ref?: FocusableElement) {
    if (this.currentFocus?.type === 'sidebar') {
      Object.values(this.sidebarTabs).forEach((tabRef) => {
        try {
          tabRef?.blur?.();
        } catch {}
      });
    }
    this.currentFocus = {
      type: 'content',
      railId,
      index,
      ref: ref || null,
    };
    if (ref) {
      this.lastFocusedContent = ref;
    }
  }

  setFocusedBillboard(buttonName: string, ref?: FocusableElement) {
    if (this.currentFocus?.type === 'sidebar') {
      Object.values(this.sidebarTabs).forEach((tabRef) => {
        try {
          tabRef?.blur?.();
        } catch {}
      });
    }
    this.currentFocus = {
      type: 'billboard',
      railId: buttonName,
      index: 0,
      ref: ref || null,
    };
  }

  setFocusedSidebar(tab: string, ref?: FocusableElement) {
    Object.entries(this.sidebarTabs).forEach(([key, tabRef]) => {
      if (tabRef && key !== tab) {
        try {
          tabRef.blur?.();
        } catch {}
      }
    });
    this.currentFocus = {
      type: 'sidebar',
      tab,
      ref: ref || null,
    };
  }

  clearFocus() {
    this.currentFocus = null;
  }

  getCurrentFocus(): FocusedItemInfo | null {
    return this.currentFocus;
  }

  focusSidebar(preferredTab?: string) {
    const target = preferredTab || this.activeTab;
    const tabRef =
      this.sidebarTabs[target] ||
      this.sidebarTabs[this.activeTab] ||
      this.sidebarTabs.home ||
      Object.values(this.sidebarTabs)[0];

    Object.values(this.sidebarTabs).forEach((r) => {
      if (r && r !== tabRef) {
        try {
          r.blur?.();
        } catch {}
      }
    });

    if (tabRef?.focus) {
      try {
        tabRef.focus();
      } catch {
        // safety
      }
    }
  }

  focusContent() {
    if (this.activeTab === 'home' && this.billboardWatchNow?.focus) {
      try {
        this.billboardWatchNow.focus();
        return;
      } catch {}
    }
    if (this.lastFocusedContent?.focus) {
      try {
        this.lastFocusedContent.focus();
        return;
      } catch {}
    }
    if (this.firstRailFirstItem?.focus) {
      try {
        this.firstRailFirstItem.focus();
        return;
      } catch {}
    }
    if (this.billboardWatchNow?.focus) {
      try {
        this.billboardWatchNow.focus();
        return;
      } catch {}
    }
  }

  focusBillboard() {
    if (this.billboardWatchNow?.focus) {
      try {
        this.billboardWatchNow.focus();
      } catch {}
    }
  }

  focusFirstRail() {
    if (this.firstRailFirstItem?.focus) {
      try {
        this.firstRailFirstItem.focus();
      } catch {}
    }
  }
}

export const tvNavigation = new TVNavigationService();
