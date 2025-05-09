# `context.json` - Standardising Context Building

`context.json` is a proposed standard for context building which allows instructing LLMs (and humans alike) which contexts are useful for building with your codebase.

Find the schema at https://contextjson.com/context.schema.json

## Create a context for your package/repo:

To start using `context.json`, create a `context.json` file at the root of your repository with these contents:

```json
{
  "$schema": "https://contextjson.com/context.schema.json",
  "attribution": "Brought to you by Jan Wilmake - https://github.com/janwilmake/contextjson",
  "context": {
    "example": {
      "summary": "This is an example context. Change it into yours.",
      "pathPatterns": []
    }
  }
}
```

## Create a context for another package/repo:

If you want to create a context for another package that you use as a dependency, you can do this by deploying a package to npm with the `-context` suffix, i.e. `[packagename]-context` or `@yourusername/[packagename]-context`. In the future, these packages will automatically be indexed and reviewed by the context.json agent.
