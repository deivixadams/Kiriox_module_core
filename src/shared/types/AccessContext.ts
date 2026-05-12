import type { ModuleCode } from './AccessControlTypes';
import type { NavItem } from './NavigationTypes';

export type AccessContext = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  company: {
    id: string;
    code: string;
    name: string;
  };
  enabledModules: ModuleCode[];
  permissions: string[];
  navigation: NavItem[];
};
