import { createAuthClient } from "better-auth/react"
import { admin } from "better-auth/plugins"
import { adminClient } from "better-auth/client/plugins"
import { nextCookies } from "better-auth/next-js"
import { emailOTPClient } from "better-auth/client/plugins"
import { ac, admin as adminRole, user, facilityOwner } from "./permissions"
import { stripeClient } from "@better-auth/stripe/client"


export const authClient = createAuthClient({
    plugins:[
        admin(),
        nextCookies(),
        emailOTPClient(),
        adminClient({
            ac,
            roles: {
                adminRole,
                user,
                facilityOwner
            }
        }),
         stripeClient({
            subscription: false
        })
    ],
    
})
