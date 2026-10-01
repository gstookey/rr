# @rr/config

Configuration as data: the per-group navigation manifest, the Building-level marking and the marking vocabulary, from `/api/config` (`practical_picture_v0.md` §3).

**S1 status:** live. One export, `DomainConfigStore` — a root `signalStore` over an `httpResource<AppConfig>` parsed with the published language's Zod schema.

It is the only place in the browser that knows which Floors exist, what they are called, what order they come in and how a marking is spelled — and it learned all of it at runtime. Two properties are load-bearing:

- **Floors are exposed in the order they were SERVED** (AW-D15). No client-side sort, ever: order is manifest data.
- **On failure it holds no Floor list at all.** "No Floors for you" and "we could not find out" must stay distinguishable, so there is no cache and no default.

Capability flags and theme tokens arrive in S4.
