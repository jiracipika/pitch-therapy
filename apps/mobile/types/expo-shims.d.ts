declare module 'expo-router' {
  import type { ComponentType, ReactNode } from 'react';

  export type Href = string;

  export interface Router {
    push(href: Href): void;
    replace(href: Href): void;
    back(): void;
    canGoBack(): boolean;
  }

  export function useRouter(): Router;
  export function usePathname(): string;

  export interface StackScreenProps {
    name?: string;
    options?: Record<string, unknown>;
  }

  export interface StackProps {
    screenOptions?: Record<string, unknown>;
    children?: ReactNode;
  }

  export const Stack: ComponentType<StackProps> & {
    Screen: ComponentType<StackScreenProps>;
  };
}

declare module 'expo-linear-gradient' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  export interface LinearGradientProps extends ViewProps {
    colors: readonly string[];
    locations?: readonly number[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
  }

  export const LinearGradient: ComponentType<LinearGradientProps>;
}

declare module 'expo-status-bar' {
  import type { ComponentType } from 'react';

  export interface StatusBarProps {
    style?: 'auto' | 'inverted' | 'light' | 'dark';
    hidden?: boolean;
    translucent?: boolean;
    backgroundColor?: string;
  }

  export const StatusBar: ComponentType<StatusBarProps>;
}

declare module 'expo-haptics' {
  export enum ImpactFeedbackStyle {
    Light = 'light',
    Medium = 'medium',
    Heavy = 'heavy',
    Rigid = 'rigid',
    Soft = 'soft',
  }

  export enum NotificationFeedbackType {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
  }

  export function impactAsync(style?: ImpactFeedbackStyle): Promise<void>;
  export function selectionAsync(): Promise<void>;
  export function notificationAsync(type?: NotificationFeedbackType): Promise<void>;
}

declare module 'expo-av' {
  export namespace Audio {
    export enum InterruptionModeIOS {
      MixWithOthers = 0,
      DoNotMix = 1,
      DuckOthers = 2,
    }

    export enum InterruptionModeAndroid {
      DoNotMix = 1,
      DuckOthers = 2,
    }

    export interface SoundStatus {
      isLoaded: boolean;
    }

    export class Sound {
      static createAsync(
        source: unknown,
        initialStatus?: Record<string, unknown>,
        onPlaybackStatusUpdate?: (status: SoundStatus) => void,
        downloadFirst?: boolean,
      ): Promise<{ sound: Sound; status: SoundStatus }>;
      loadAsync(source: unknown, initialStatus?: Record<string, unknown>, downloadFirst?: boolean): Promise<SoundStatus>;
      playAsync(): Promise<SoundStatus>;
      replayAsync(status?: Record<string, unknown>): Promise<SoundStatus>;
      unloadAsync(): Promise<SoundStatus>;
    }

    export function setAudioModeAsync(mode: Record<string, unknown>): Promise<void>;
  }
}
