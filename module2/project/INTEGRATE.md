# Integrate learning with reflection

1. How did you find collaborating with your assistant on the context docs given it can read the implementation? Did you collaborate using different models?

The assistant got really hung up on the memory subdirectory! It first assumed that this meant the service should only use in-memory caching and that it should remove all the postgres-related code (!). Fortunately I could divert it from that path during the Plan phase! 

Its first editing suggestions completely ignored my initial draft of memory/ABOUT.md (copied from module2 files) so I asked it whether any of the exisitng text would be useful if it were to recreate the project in future without reference to the existing files and it said "good idea!" but then completely ignored it again and just got really detailed info from the package.json, docker-compose etc. I forgot that switching to ACT would cause it to immediately implement it... oops! It successfully split out the arch and tech sections into new files.

2. Did you ever end up with too much memory for your context window and necessary session lengths?

Not yet.

3. How eager was your assistant? How much did you have to delete or ask them to remove? Did you try to mitigate this for similar tasks in the future? Did your mitigations work?

It was planning to put everything in one file which was unwieldy, but when I gave more structure around what info should go where it quickly became more structured.

When I asked it to create a phrase and add it to the memory.md file it wanted to delete the entire file and replace it with the phrase!!!

4. How reliable was your assistant at loading the context? Were you able to use reliably use command phrases?

I keep getting the error "Unexpected API Response: The language model did not provide any assistant messages. This may indicate an issue with the API or the model's output." Possibly because I was using the free model?


Before the next time we meet, please post a link to your repo and your reflections to Discord.
