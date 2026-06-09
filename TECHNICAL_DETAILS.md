# Security

This table contains the username and password combinations for each of the components. We distinguish between technical users and admin users.

| Component     | Username                    | Password              | Origin                | Usage          |
|---------------|-----------------------------|-----------------------|-----------------------|----------------|
| Quepid        | admin@choruselectronics.com | password              | `quickstart.sh`       | Admin User     |
| MySQL         | root                        | password              | `docker-compose.yml`  | Admin User     |
| OpenSearch    | admin                       | MyStr0ng!P@ssw0rd2024 | `docker-compose.yml`  | Admin User     |
| OS Dashboard  | pete                        | MyStr0ng!P@ssw0rd2024 | `setup_chorus_team.sh`| Product Manager|
| OS Dashboard  | rumi                        | MyStr0ng!P@ssw0rd2024 | `setup_chorus_team.sh`| Relevance Engr |
| OS Dashboard  | eddie                       | MyStr0ng!P@ssw0rd2024 | `setup_chorus_team.sh`| Expert User    |

# Webapp and CORS

We tried to have webapp log directly to Dataprepper via CORS proxy, no joy.  We will experiment with an actual API.

If you change to logging directly to opensearch then you don't need the proxy, it is already set up for that.
