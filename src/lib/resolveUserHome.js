export function resolveUserHome(userType, isAdmin) {
  if (isAdmin) {
    return "/admin/dashboard";
  }

  switch (userType) {
    case "professionnel":
      return "/dashboard-professionnel";
    case "particulier":
      return "/dashboard-particulier";
    default:
      return "/"; // Default home page
  }
}