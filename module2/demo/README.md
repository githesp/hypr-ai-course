# Demo

## Step 1

Add the `./memory` folder and talk through the contents of the files.


## Step 2

Add the `./.clinerules/memory.md` and verify Cline sees it.

Restart Cline and verify it loads the memory before doing anything else.


## Step 3

Ask the assistant questions about its understanding of the codebase.

Propose a prompt for using the context to build the client library:

> As described in this project, applications throughout the organisation will be consuming this service to retrieve their configuration settings. To do this, the only thing they should need is the URL of the Config Service. The expectation is we will have client libraries for each application type and language we need. Currently the admin web ui is consuming the service directly and is not using a TypeScript Web client library. Using what you know about the service and the current admin ui, recommend an implementation plan for a TypeScript client library the admin ui (and other TypeScript web clients) can use going forward. Create the library as a new folder in @ui/ for now with the expectation we will create a separate deployable package in the future - so be mindful of how the admin ui is dependent on the library.
