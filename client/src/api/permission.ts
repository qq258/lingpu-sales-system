import request from './request'

export interface MenuOption {
  key: string
  label: string
  group: string
}

export interface RolePermission {
  role: string
  menuKeys: string[]
}

export async function getMyMenuKeys(): Promise<string[]> {
  const res: any = await request.get('/permissions/menus')
  return res.data || []
}

export async function getMenuOptions(): Promise<MenuOption[]> {
  const res: any = await request.get('/permissions/menu-options')
  return res.data || []
}

export async function getRolePermissions(): Promise<RolePermission[]> {
  const res: any = await request.get('/permissions/roles')
  return res.data || []
}

export async function updateRolePermission(role: string, menuKeys: string[]): Promise<string[]> {
  const res: any = await request.put(`/permissions/roles/${role}`, { menuKeys })
  return res.data || []
}
