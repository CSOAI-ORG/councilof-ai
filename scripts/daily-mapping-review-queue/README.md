# Daily mapping review queue

Prepare a review queue from an existing retained daily-signal report and its exact crosswalk bytes:

```sh
node build.mjs /path/to/daily-report.json /path/to/crosswalk.json /path/to/new-queue.json
node --test build.test.mjs
```

This does not create a reviewed mapping. Each pending item retains its event digest and leaves the official source, candidate provision, and reviewer blank. The builder rejects a crosswalk whose byte digest does not match the report and refuses to overwrite an existing output. Supply an independently reviewed mapping separately to the existing daily-signal builder; this queue is not accepted as its mappings input. Check official source versions and applicability before relying on the underlying clock assertions.
