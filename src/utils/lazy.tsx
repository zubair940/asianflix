import { lazy, ComponentType, LazyExoticComponent } from 'react';

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<any>,
  name?: string
): LazyExoticComponent<T> {
  const LazyComponent = lazy(async (): Promise<{ default: T }> => {
    const module = await importFn();
    const withDefault = module as { default?: T };
    if (withDefault.default) return { default: withDefault.default };
    const key = Object.keys(module).find(
      (k) => typeof module[k] === 'function' || typeof module[k] === 'object'
    );
    return { default: (key ? module[key] : null) as T };
  });

  if (name) {
    Object.defineProperty(LazyComponent, 'displayName', { value: `Lazy(${name})` });
  }

  return LazyComponent;
}

export const LazyPages = {
  Home: createLazyComponent(() => import('../pages/Home.js'), 'Home'),
  DramaPage: createLazyComponent(() => import('../pages/DramaPage.js'), 'DramaPage'),
  WatchPage: createLazyComponent(() => import('../pages/WatchPage.js'), 'WatchPage'),
  SearchPage: createLazyComponent(() => import('../pages/SearchPage.js'), 'SearchPage'),
  LoginPage: createLazyComponent(() => import('../pages/LoginPage.js'), 'LoginPage'),
  RegisterPage: createLazyComponent(() => import('../pages/RegisterPage.js'), 'RegisterPage'),
  ProfilePage: createLazyComponent(() => import('../pages/ProfilePage.js'), 'ProfilePage'),
  AdminPage: createLazyComponent(() => import('../pages/AdminPage.js'), 'AdminPage'),
};