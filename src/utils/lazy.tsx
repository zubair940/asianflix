import { lazy, ComponentType } from 'react';

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  name?: string
) {
  const LazyComponent = lazy(async () => {
    const module = await importFn();
    // Handle both default export and named export
    if ('default' in module) {
      return { default: module.default };
    }
    // Find the first exported React component
    const componentKeys = Object.keys(module).filter(
      (key) => typeof module[key] === 'function' || typeof module[key] === 'object'
    );
    const defaultExport = componentKeys[0] ? module[componentKeys[0]] : Object.values(module)[0];
    return { default: defaultExport as T };
  });

  if (name) {
    LazyComponent.displayName = `Lazy(${name})`;
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