import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

// Define all available permissions for QuickCourt platform
export const statement = {
    ...defaultStatements,
    
    // Facility Management
    facility: ["create", "read", "update", "delete", "approve", "reject", "suspend"],
    
    // Court Management
    court: ["create", "read", "update", "delete", "manage_availability"],
    
    // Booking Management
    booking: ["create", "read", "update", "cancel", "confirm", "complete", "view_all"],
    
    // Review Management
    review: ["create", "read", "update", "delete", "moderate", "approve", "hide"],
    
    // User Management
    user_management: ["read", "update", "ban", "unban", "delete", "view_history"],
    
    // Analytics & Reports
    analytics: ["view_own", "view_all", "export"],
    
    // System Settings
    system: ["manage_settings", "manage_banners", "manage_amenities", "manage_templates"],
    
    // Support & Moderation
    support: ["create_ticket", "manage_tickets", "moderate_reports", "resolve_reports"],
    
    // Payment & Financial
    payment: ["process", "refund", "view_own", "view_all", "manage_commissions"],
    
    // Content Management
    content: ["create", "read", "update", "delete", "publish", "moderate"],
    
    // Notifications
    notification: ["send_to_self", "send_to_users", "send_to_all", "manage_preferences"],
    
    // Time Slots
    timeslot: ["create", "read", "update", "delete", "block", "unblock"],
    
    // Maintenance
    maintenance: ["create", "read", "update", "delete", "schedule"]
} as const;

export const ac = createAccessControl(statement);

// USER Role Permissions
export const userRole = ac.newRole({
    // Profile Management (using default user permissions)
    user: ["update"], // Can update own profile
    
    // Facility & Court Browsing
    facility: ["read"],
    court: ["read"],
    
    // Booking Management
    booking: ["create", "read", "cancel"], // Own bookings only
    
    // Reviews
    review: ["create", "read", "update"], // Own reviews only
    
    // Support
    support: ["create_ticket"],
    
    // Notifications
    notification: ["send_to_self", "manage_preferences"],
    
    // Payment
    payment: ["process", "view_own"],
    
    // Analytics (own data only)
    analytics: ["view_own"]
});

// FACILITY_OWNER Role Permissions
export const facilityOwnerRole = ac.newRole({
    // Inherit basic user permissions
    user: ["update"],
    
    // Facility Management
    facility: ["create", "read", "update", "delete"], // Own facilities only
    
    // Court Management
    court: ["create", "read", "update", "delete", "manage_availability"], // Own courts only
    
    // Time Slot Management
    timeslot: ["create", "read", "update", "delete", "block", "unblock"],
    
    // Maintenance Management
    maintenance: ["create", "read", "update", "delete", "schedule"],
    
    // Booking Management
    booking: ["create", "read", "update", "confirm", "complete", "view_all"], // For own facilities
    
    // Reviews (for own facilities)
    review: ["create", "read", "update", "moderate"], // Can moderate reviews for own facilities
    
    // Analytics (own facility data)
    analytics: ["view_own", "export"],
    
    // Payment (for own facilities)
    payment: ["process", "view_own", "view_all"], // Own facility earnings
    
    // Support
    support: ["create_ticket", "manage_tickets"], // Own tickets
    
    // Content (facility-related)
    content: ["create", "read", "update", "delete"], // Own facility content
    
    // Notifications
    notification: ["send_to_self", "send_to_users", "manage_preferences"]
});

// ADMIN Role Permissions
export const adminRole = ac.newRole({
    // Include Better Auth admin capabilities first
    ...adminAc.statements,
    
    // Full user management access (this will override the user key from adminAc)
    user_management: ["read", "update", "ban", "unban", "delete", "view_history"],
    
    // Full facility management
    facility: ["create", "read", "update", "delete", "approve", "reject", "suspend"],
    
    // Full court management
    court: ["create", "read", "update", "delete", "manage_availability"],
    
    // Full booking management
    booking: ["create", "read", "update", "cancel", "confirm", "complete", "view_all"],
    
    // Full review management
    review: ["create", "read", "update", "delete", "moderate", "approve", "hide"],
    
    // Full analytics access
    analytics: ["view_own", "view_all", "export"],
    
    // System management
    system: ["manage_settings", "manage_banners", "manage_amenities", "manage_templates"],
    
    // Full support management
    support: ["create_ticket", "manage_tickets", "moderate_reports", "resolve_reports"],
    
    // Full payment management
    payment: ["process", "refund", "view_own", "view_all", "manage_commissions"],
    
    // Full content management
    content: ["create", "read", "update", "delete", "publish", "moderate"],
    
    // Full notification management
    notification: ["send_to_self", "send_to_users", "send_to_all", "manage_preferences"],
    
    // Full time slot management
    timeslot: ["create", "read", "update", "delete", "block", "unblock"],
    
    // Full maintenance management
    maintenance: ["create", "read", "update", "delete", "schedule"]
});

// Helper functions for permission checking
export const permissions = {
    // Check if user can manage facility
    canManageFacility: (userRole: string, facilityOwnerId?: number, userId?: number) => {
        if (userRole === 'ADMIN') return true;
        if (userRole === 'FACILITY_OWNER' && facilityOwnerId === userId) return true;
        return false;
    },
    
    // Check if user can view bookings
    canViewBookings: (userRole: string, bookingUserId?: number, facilityOwnerId?: number, userId?: number) => {
        if (userRole === 'ADMIN') return true;
        if (userRole === 'USER' && bookingUserId === userId) return true;
        if (userRole === 'FACILITY_OWNER' && facilityOwnerId === userId) return true;
        return false;
    },
    
    // Check if user can moderate content
    canModerateContent: (userRole: string) => {
        return userRole === 'ADMIN';
    },
    
    // Check if user can approve facilities
    canApproveFacilities: (userRole: string) => {
        return userRole === 'ADMIN';
    },
    
    // Check if user can view analytics
    canViewAnalytics: (userRole: string, resourceOwnerId?: number, userId?: number) => {
        if (userRole === 'ADMIN') return true;
        if (userRole === 'FACILITY_OWNER' && resourceOwnerId === userId) return true;
        if (userRole === 'USER' && resourceOwnerId === userId) return true;
        return false;
    },
    
    // Check if user can manage users
    canManageUsers: (userRole: string) => {
        return userRole === 'ADMIN';
    },
    
    // Check if user can process payments
    canProcessPayments: (userRole: string, bookingUserId?: number, userId?: number) => {
        if (userRole === 'ADMIN') return true;
        if (userRole === 'USER' && bookingUserId === userId) return true;
        return false;
    },
    
    // Check if user can manage system settings
    canManageSystem: (userRole: string) => {
        return userRole === 'ADMIN';
    },
    
    // Check if user can cancel booking
    canCancelBooking: (userRole: string, bookingUserId?: number, facilityOwnerId?: number, userId?: number) => {
        if (userRole === 'ADMIN') return true;
        if (userRole === 'USER' && bookingUserId === userId) return true;
        if (userRole === 'FACILITY_OWNER' && facilityOwnerId === userId) return true;
        return false;
    },
    
    // Check if user can create facility
    canCreateFacility: (userRole: string) => {
        return userRole === 'FACILITY_OWNER' || userRole === 'ADMIN';
    },
    
    // Check if user can write review
    canWriteReview: (userRole: string, bookingUserId?: number, userId?: number) => {
        if (userRole === 'ADMIN') return true;
        if (userRole === 'USER' && bookingUserId === userId) return true;
        return false;
    },
    
    // Check if user can manage time slots
    canManageTimeSlots: (userRole: string, facilityOwnerId?: number, userId?: number) => {
        if (userRole === 'ADMIN') return true;
        if (userRole === 'FACILITY_OWNER' && facilityOwnerId === userId) return true;
        return false;
    }
};

// Role hierarchy for easy checking
export const roleHierarchy = {
    USER: 1,
    FACILITY_OWNER: 2,
    ADMIN: 3
} as const;

// Check if user has higher or equal role
export const hasRoleOrHigher = (userRole: keyof typeof roleHierarchy, requiredRole: keyof typeof roleHierarchy) => {
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Role-based access control functions
export const rbac = {
    // Get role object by role string
    getRoleObject: (roleString: string) => {
        switch (roleString) {
            case 'USER':
                return userRole;
            case 'FACILITY_OWNER':
                return facilityOwnerRole;
            case 'ADMIN':
                return adminRole;
            default:
                return null;
        }
    },
    
    // Check if user has specific permission using role object
    hasPermission: (roleObject: any, resource: string, action: string) => {
        try {
            return roleObject?.authorize && roleObject.authorize({ [resource]: [action] });
        } catch {
            return false;
        }
    },
    
    // Get all permissions for a role
    getRolePermissions: (roleString: string) => {
        switch (roleString) {
            case 'USER':
                return userRole.statements;
            case 'FACILITY_OWNER':
                return facilityOwnerRole.statements;
            case 'ADMIN':
                return adminRole.statements;
            default:
                return {};
        }
    }
};

// Export the roles with different names to avoid conflicts
export { userRole as user, facilityOwnerRole as facilityOwner, adminRole as admin }; 