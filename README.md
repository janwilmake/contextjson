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

Here is the lmpify-table for this repo (made using our own [context.json](context.json))
| Summary | Prompt it |
|---------|-----------|
| Create a new context.json for your repo | [![](https://b.lmpify.com/new)](https://lmpify.com?q=https%3A%2F%2Fuuithub.com%2Fjanwilmake%2Fcontextjson%2Ftree%2Fmain%3FpathPatterns%3Dcontext.schema.json%26pathPatterns%3DREADME.md%0A%0APlease%20create%20a%20context.json%20for%20the%20following%20repo%3A%20https%3A%2F%2Fuithub.com%2F%7B%7Bowner%7D%7D%2F%7B%7Brepo%7D%7D%0A%0AWhen%20creating%20a%20%60context.json%60%20it's%20very%20important%20to%20test%20whether%20or%20not%20the%20context%20actually%20includes%20all%20needed%20information%20for%20the%20described%20purpose%20and%20isn't%20missing%20anything.%20It%20should%20also%20not%20include%20anything%20that%20wouldn't%20be%20useful.%20Summaries%20should%20be%20succinct%20and%20to%20the%20point.%20A%20well-defined%20%60context.json%60%20creates%20contexts%20that%20allow%20LLMs%20to%20fulfil%20tasks%20far%20more%20efficiently%20than%20they%20otherwise%20would%2C%20saving%20costly%20time%20and%20tokens%20in%20exploring%20the%20codebase.%0A%0ASome%20examples%20of%20good%20context.json's%3A%20%0A%0A-%20https%3A%2F%2Fraw.githubusercontent.com%2Fjanwilmake%2Fdorm%2Frefs%2Fheads%2Fmain%2Fcontext.json%0A%0A-%20https%3A%2F%2Fraw.githubusercontent.com%2Feastlondoner%2Fcursor-tools%2Frefs%2Fheads%2Fmain%2Fcontext.json%0A%0A-%20https%3A%2F%2Fraw.githubusercontent.com%2Fjanwilmake%2Fstripeflare%2Frefs%2Fheads%2Fmain%2Fcontext.json) |

### Create a context for another package/repo:

If you want to create a context for another package that you use as a dependency, you can do this by deploying a package to npm with the `-context` suffix, i.e. `[packagename]-context` or `@yourusername/[packagename]-context`. This allows easy programmatic exploration of context.

### Deploy your context to the web as well

If your repo is deployed at a website and you want AI to understand context for this website as well, ensure context.json is made available at https://yourdomain.com/context.json, and also make a `package.json` available at https://yourdomain.com/package.json with the "repository" field, to tell which files are used for the deployed `context.json`.
