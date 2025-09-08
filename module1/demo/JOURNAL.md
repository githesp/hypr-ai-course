2025-09-07
prompt: "Create a web API in TypeScript for an API that manages config settings for multiple applications in my enterprise. Put it in the config-service directory. Use prompts/web-api-1.md for context"
It made a decent app but used an in-memory cache in place of a db, in spite of me telling it to use postgres. It didn't include tests (ignored that part of the file)
I iterated on this, getting it to add a db and tests. It took many passes for it to get the tests running, but we got there in the end!

- Prompt (what we're asking of our assistant): "I want you to help me create a prompt, I want to create a REST web API for managing the configuration of multiple projects. The applications will use this API to retrieve its configuration values when they start up. The language is TypeScript, the database engine is Postgresql, I want it to use express.js, and have automated tests for each relevant file"
- Tool (our AI assistant): Cline
- Mode (plan, act, etc.): Plan
- Context (clean, from previous, etc.): Clean
- Model (LLM model and version): grok-code-fast-1
- Input (file added to the prompt): none
- Output (file that contains the response): prompts/web-api-3.md
- Cost (total cost of the full run): free
- Reflections (narrative assessments of the response): It had a few extra bits and pieces but basically good

- Prompt: "Read @/prompts/web-api-3.md and follow the instructions at the top of the file."
- Tool (our AI assistant): Cline
- Mode (plan, act, etc.): Act
- Context (clean, from previous, etc.): Clean
- Model (LLM model and version): grok-code-fast-1
- Input (file added to the prompt): prompts/web-api-3.md
- Output (file that contains the response): config-api
- Cost (total cost of the full run): free
- Reflections (narrative assessments of the response): It ignored my instruction to put it in an existing directory. Didn't manage to get the test files to compile this time! It said all the tests are passing when 10 are still failing. It doesn't seem to be very good at intepreting the test results correctly.
I started a new task and asked it to run the tests and fix the failures. I got error "Unexpected API Response: The language model did not provide any assistant messages. This may indicate an issue with the API or the model's output." After a few tries it fixed the db test isolation issue and the validation setup and now all its tests pass.
I need to add instructions for it to make a test db rather than using the main db for testing!
How do I tell it to put the code in a specific directory in a way that it will follow the instruction?
I think I need to tell it explicitly that the tests need to pass!
I need my git repo to be a level out... or two. 