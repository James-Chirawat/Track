export const MANAGED_ENTERPRISE_NAMES = [
  'วิสาหกิจชุมชนดองได้ดองดี',
  'วิสาหกิจเกษตรอินทรีย์ Ndo fulltime',
  'วิสาหกิจชุมชนรักษ์ดินทอง',
  'วิสาหกิจชุมชน Society farm'
]

const BRANCH_NAME_ALIASES = {
  'วิสาหกิจชุมชนเกษตรอินทรีย์ N-DO Fulltime': 'วิสาหกิจเกษตรอินทรีย์ Ndo fulltime'
}

export const getEnterpriseDisplayName = (name) => {
  return BRANCH_NAME_ALIASES[name] || name
}

const normalizeEnterpriseName = (name) => {
  return String(name || '')
    .replace(/วิสาหกิจชุมชน/g, 'วิสาหกิจ')
    .replace(/[-\s]/g, '')
    .toLowerCase()
}

const MANAGED_ENTERPRISE_KEYS = new Set(
  MANAGED_ENTERPRISE_NAMES.map(normalizeEnterpriseName)
)

export const isManagedEnterprise = (name) => {
  return MANAGED_ENTERPRISE_KEYS.has(
    normalizeEnterpriseName(getEnterpriseDisplayName(name))
  )
}

export const filterManagedBranches = (branches = []) => {
  return branches.filter((branch) => isManagedEnterprise(branch.name || branch.branchName))
}
