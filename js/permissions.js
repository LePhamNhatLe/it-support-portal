const PERMISSIONS = {
    DASHBOARD: "dashboard",
    TICKETS: "tickets",
    TICKET_DETAIL: "ticket_detail",
    DEVICES: "devices",
    USERS: "users",
    NETWORK: "network",
    REPORTS: "reports",
    SETTINGS: "settings"
};

const ROLES = {
    technical_lead: {
        name: "Trưởng nhóm kỹ thuật",
        permissions: Object.values(PERMISSIONS)
    },

    technician: {
        name: "Nhân viên kỹ thuật",
        permissions: [
            PERMISSIONS.DASHBOARD,
            PERMISSIONS.TICKETS,
            PERMISSIONS.TICKET_DETAIL,
            PERMISSIONS.DEVICES,
            PERMISSIONS.NETWORK,
            PERMISSIONS.SETTINGS
        ]
    },

    user: {
        name: "Người dùng",
        permissions: [
            PERMISSIONS.DASHBOARD,
            PERMISSIONS.TICKETS,
            PERMISSIONS.TICKET_DETAIL,
            PERMISSIONS.SETTINGS
        ]
    }
};

function getCurrentRole() {
    const raw = localStorage.getItem("currentUser");

    if (!raw) {
        return null;
    }

    try {
        const currentUser = JSON.parse(raw);

        if (!currentUser || typeof currentUser.role !== "string") {
            return null;
        }

        return currentUser.role;
    } catch (error) {
        return null;
    }
}

function hasPermission(permission) {
    const role = getCurrentRole();

    if (!role || !ROLES[role]) {
        return false;
    }

    return ROLES[role].permissions.includes(permission);
}

function hasRole(role) {
    return getCurrentRole() === role;
}

function getRoleName(role) {
    const targetRole = role || getCurrentRole();

    if (!targetRole || !ROLES[targetRole]) {
        return null;
    }

    return ROLES[targetRole].name;
}

function getAllowedPermissions() {
    const role = getCurrentRole();

    if (!role || !ROLES[role]) {
        return [];
    }

    return [...ROLES[role].permissions];
}
window.AppPermissions = {
    PERMISSIONS,
    ROLES,
    getCurrentRole,
    hasPermission,
    hasRole,
    getRoleName,
    getAllowedPermissions
};