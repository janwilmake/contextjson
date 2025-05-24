# [`context.json`](https://github.com/janwilmake/contextjson) - Standard for LLM Context

`context.json` is a proposed standard that allows instructing LLMs (and humans alike) what files in the codebase are relevant for different usecases.

Goals:

- Make it easy for maintainers to define the useful context in a single place
- Allow maintainers faster adoption of their codebase by making it more approachable
- Make it easy for developers and AI agents to get started using a new codebase
- Allow programs to analyze specific parts of the codebase at scale

A well-defined `context.json` creates contexts that allow LLMs to fulfil tasks far more efficiently than they otherwise would, saving costly time and tokens in exploring the codebase. In the same way it also makes the codebase more accessible to humans.

## Tooling

`context.json` aims to become a standard for defining context in file-systems and is made more useful the more tools adopt/integrate with it. Current tooling that integrates/adopts context.json include:

- https://uithub.com will have a plugin for contextjson to transform any codebase into the defined contexts
- CLI: `npx contextjson` allows locally retrieving all contexts (one md file per context) in a `.context` folder
- https://contextjson.com (official website) allows:
    - generating a README Snippet and token overview of the context
    - LLM instructions and lmpify.com integration to easily create a new `context.json` for your codebase. 

## Getting started

To start using `context.json`, create a `context.json` file at the root of your repository. 

View the Schema at https://contextjson.com/schema

### Create a context for another package/repo:

If you want to create a context for another package that you use as a dependency, you can do this by deploying a package to npm with the `-context` suffix, i.e. `[packagename]-context` or `@yourusername/[packagename]-context`. This allows easy programmatic exploration of context.

### Deploy your context to the web as well

If your repo is deployed at a website and you want AI to understand context for this website as well, ensure context.json is made available at https://yourdomain.com/context.json, and also make a `package.json` available at https://yourdomain.com/package.json with the "repository" field, to tell which files are used for the deployed `context.json`.
