# Schema References in YAML Files

- All schema references **must be written in the `.yml` files**.
- Schema names follow the pattern:

- These schema files exist **only during the development stage** and are not be present in production.

- The patterns of docs:

```
docs/
|--paths/
|   |-- <moduleName>.get.yml
|   |-- <moduleName>.put.yml
|   |-- <moduleName>.post.yml
|   |-- <moduleName>.delete.yml
|   |-- <moduleName>.patch.yml
|
|--components/
|   |-- <moduleName>.parameters.yml
|   |-- <moduleName>.responses.yml
|   |-- <moduleName>.schemas.yml
```

- As for integrating your module docs, there is the registry file needs to load all that is need about the docs.
- Then after that docs is used in multiple areas in the integration. Look and find out, if you can't understand call Omar.

## If You Don’t Want to Inspect the Schema Files

- You may directly use the **variable name** defined in:
- Ensure the variable name matches exactly what is used in the request body definition.
