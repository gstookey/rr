import json, os

# Persona roster mirrors packages/mock-oidc/src/personas.ts, which mirrors
# domain_model_v0.md. Keep the three in step; the mock-oidc round-trip test is
# what catches the claim shape drifting.
PERSONAS = [
    ("ada",  "Ada",  "Vance",     "ada@tick-tock.example",     ["/ttw"],     [], "INTERNAL",   ["TTW"]),
    ("bram", "Bram", "Oduya",     "bram@tick-tock.example",    ["/ttw"],     [], "INTERNAL",   ["TTW"]),
    ("cy",   "Cy",   "Delacroix", "cy@tick-tock.example",      ["/ttw"],     ["group-admin"], "INTERNAL", ["TTW", "TTW/NWL"]),
    ("dee",  "Dee",  "Marchetti", "dee@meridian.example",      ["/mer"],     [], "INTERNAL",   ["MER"]),
    ("eli",  "Eli",  "Nakamura",  "eli@meridian.example",      ["/mer"],     ["group-admin"], "INTERNAL", ["MER"]),
    ("fay",  "Fay",  "Oyelaran",  "fay@northwind.example",     ["/ttw/nwl"], [], "PARTNER",    ["TTW/NWL"]),
    ("gus",  "Gus",  "Almeida",   "gus@acme-workshop.example", ["/acme-staff"], ["platform-admin"], "RESTRICTED", ["TTW", "TTW/NWL", "MER"]),
]

def user(username, first, last, email, groups, realm_roles, level, compartments):
    return {
        "username": username,
        "enabled": True,
        "emailVerified": True,
        "firstName": first,
        "lastName": last,
        "email": email,
        "credentials": [{"type": "password", "value": "changeme", "temporary": False}],
        "attributes": {"handling_level": [level], "compartments": compartments},
        "groups": groups,
        "realmRoles": realm_roles,
    }

def attr_mapper(name, user_attribute, claim, multivalued):
    return {
        "name": name,
        "protocol": "openid-connect",
        "protocolMapper": "oidc-usermodel-attribute-mapper",
        "consentRequired": False,
        "config": {
            "user.attribute": user_attribute,
            "claim.name": claim,
            "jsonType.label": "String",
            "multivalued": "true" if multivalued else "false",
            "aggregate.attrs": "true" if multivalued else "false",
            "id.token.claim": "true",
            "access.token.claim": "true",
            "userinfo.token.claim": "true",
            "introspection.token.claim": "true",
        },
    }

GROUP_MAPPER = {
    "name": "groups",
    "protocol": "openid-connect",
    "protocolMapper": "oidc-group-membership-mapper",
    "consentRequired": False,
    "config": {
        "claim.name": "groups",
        # FULL PATHS: /ttw/nwl, not nwl. The B2B sub-compartment is only
        # distinguishable from its parent by the path.
        "full.path": "true",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "userinfo.token.claim": "true",
        "introspection.token.claim": "true",
    },
}

# The declarative user profile. Keycloak 24+ REJECTS unmanaged user attributes by
# default, so `handling_level` and `compartments` must be declared here or the
# import silently drops them and every claim comes back empty. Verified against
# UPConfig.java / DeclarativeUserProfileProvider.java on the release/26.7 branch
# (config key "kc.user.profile.config").
def up_attr(name, multivalued=False):
    a = {
        "name": name,
        "displayName": name,
        "permissions": {"view": ["admin", "user"], "edit": ["admin"]},
        "multivalued": multivalued,
    }
    return a

USER_PROFILE = {
    "unmanagedAttributePolicy": "ENABLED",
    "attributes": [
        {"name": "username", "displayName": "${username}", "permissions": {"view": ["admin", "user"], "edit": ["admin", "user"]},
         "validations": {"length": {"min": 3, "max": 255}, "username-prohibited-characters": {}}, "multivalued": False},
        {"name": "email", "displayName": "${email}", "permissions": {"view": ["admin", "user"], "edit": ["admin", "user"]},
         "validations": {"email": {}, "length": {"max": 255}}, "multivalued": False},
        {"name": "firstName", "displayName": "${firstName}", "permissions": {"view": ["admin", "user"], "edit": ["admin", "user"]},
         "validations": {"length": {"max": 255}}, "multivalued": False},
        {"name": "lastName", "displayName": "${lastName}", "permissions": {"view": ["admin", "user"], "edit": ["admin", "user"]},
         "validations": {"length": {"max": 255}}, "multivalued": False},
        up_attr("handling_level"),
        up_attr("compartments", multivalued=True),
    ],
}

# NOTE: no "$comment" key anywhere in this document. Keycloak deserialises a
# realm export with a stock Jackson ObjectMapper (JsonSerialization.java,
# release/26.7) that does NOT disable FAIL_ON_UNKNOWN_PROPERTIES, so an unknown
# top-level key would abort the import with UnrecognizedPropertyException. The
# provenance and the caveats live in infra/keycloak/README.md instead.
realm = {
    "realm": "acme-workshop",
    "displayName": "ACME Workshop",
    "enabled": True,
    "sslRequired": "none",
    "registrationAllowed": False,
    "resetPasswordAllowed": False,
    "editUsernameAllowed": False,
    "loginWithEmailAllowed": True,
    "duplicateEmailsAllowed": False,
    "accessTokenLifespan": 300,
    "ssoSessionIdleTimeout": 1800,
    "ssoSessionMaxLifespan": 36000,
    "defaultSignatureAlgorithm": "RS256",

    "roles": {
        "realm": [
            {"name": "group-admin",
             "description": "May administer their OWN group's membership through the Front Desk Floor. Keycloak's fine-grained admin permissions (FGAP V2) are what actually scope it server-side, in S7 — this role only makes the Office visible."},
            {"name": "platform-admin",
             "description": "ACME staff. Sees every Floor and every group."},
        ],
        "client": {},
    },

    "groups": [
        {
            "name": "ttw",
            "path": "/ttw",
            "attributes": {
                "tenant_kind": ["manufacturer"],
                "compartment": ["TTW"],
                "display_name": ["Tick-Tock Watchworks"],
                # Rung 4 of the Boundary Test, as data: which Floors this group
                # gets. MER's list below deliberately omits vigilance.
                "floors": ["invent", "command", "vigilance", "front-desk"],
            },
            "realmRoles": [],
            "subGroups": [
                {
                    "name": "nwl",
                    "path": "/ttw/nwl",
                    "attributes": {
                        "tenant_kind": ["b2b-customer"],
                        "compartment": ["TTW/NWL"],
                        "display_name": ["Northwind Logistics"],
                        "floors": ["vigilance"],
                    },
                    "realmRoles": [],
                    "subGroups": [],
                }
            ],
        },
        {
            "name": "mer",
            "path": "/mer",
            "attributes": {
                "tenant_kind": ["manufacturer"],
                "compartment": ["MER"],
                "display_name": ["Meridian Wearables"],
                "floors": ["invent", "command", "front-desk"],
            },
            "realmRoles": [],
            "subGroups": [],
        },
        {
            "name": "acme-staff",
            "path": "/acme-staff",
            "attributes": {
                "tenant_kind": ["platform-operator"],
                "compartment": ["TTW", "TTW/NWL", "MER"],
                "display_name": ["ACME staff"],
                "floors": ["invent", "command", "vigilance", "front-desk"],
            },
            "realmRoles": [],
            "subGroups": [],
        },
    ],

    "clientScopes": [
        {
            "name": "acme-workshop",
            "description": "ACME Workshop's own claims: group membership (full paths), handling level and compartments. This scope is what makes the token say what the RLS policy needs to hear.",
            "protocol": "openid-connect",
            "attributes": {
                "include.in.token.scope": "true",
                "display.on.consent.screen": "false",
            },
            "protocolMappers": [
                GROUP_MAPPER,
                attr_mapper("handling level", "handling_level", "handling_level", multivalued=False),
                attr_mapper("compartments", "compartments", "compartments", multivalued=True),
            ],
        }
    ],
    "defaultDefaultClientScopes": ["acme-workshop"],

    "clients": [
        {
            "clientId": "acme-workshop-gateway",
            "name": "ACME Workshop BFF",
            "description": "The Express gateway. CONFIDENTIAL client, authorization-code flow, no browser-side token — the BFF/cookie pattern (DA-D17, BCP 212).",
            "enabled": True,
            "protocol": "openid-connect",
            "publicClient": False,
            "bearerOnly": False,
            "standardFlowEnabled": True,
            "implicitFlowEnabled": False,
            "directAccessGrantsEnabled": False,
            "serviceAccountsEnabled": False,
            "secret": "dev-only-not-a-secret",
            "redirectUris": ["http://localhost:3000/auth/callback"],
            "webOrigins": ["http://localhost:4200", "http://localhost:3000"],
            "baseUrl": "http://localhost:4200/",
            "attributes": {
                "post.logout.redirect.uris": "http://localhost:4200/*",
                "pkce.code.challenge.method": "S256",
            },
            "defaultClientScopes": ["profile", "email", "roles", "web-origins", "acme-workshop"],
            "optionalClientScopes": [],
        }
    ],

    "users": [user(*p) for p in PERSONAS],

    "components": {
        "org.keycloak.userprofile.UserProfileProvider": [
            {
                "name": "declarative-user-profile",
                "providerId": "declarative-user-profile",
                "subComponents": {},
                "config": {"kc.user.profile.config": [json.dumps(USER_PROFILE)]},
            }
        ]
    },
}

os.makedirs("/home/user/rr/infra/keycloak", exist_ok=True)
with open("/home/user/rr/infra/keycloak/realm-acme-workshop.json", "w") as f:
    json.dump(realm, f, indent=2)
    f.write("\n")
print("realm written")
