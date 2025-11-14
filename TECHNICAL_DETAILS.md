# Security

**We have disabled security in OpenSearch for now.**

This table contains the username and password combinations for each of the components. We distinguish between technical users and admin users.

| Component     | Username                    | Password     | Origin               | Usage          |
|---------------|-----------------------------|--------------|----------------------|----------------|
| Quepid        | admin@choruselectronics.com | password     | `quickstart.sh`      | Admin User     |
| MySQL         | root                        | password     | `docker-compose.yml` | Admin User     |

# Webapp and CORS

We tried to have webapp log directly to Dataprepper via CORS proxy, no joy.  We will experiment with an actual API.

If you change to logging directly to opensearch then you don't need the proxy, it is already set up for that.
