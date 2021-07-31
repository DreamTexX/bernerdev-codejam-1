CONFIG_FLAGS=
PERMISSION_FLAGS=--allow-env --allow-net --allow-read --allow-write

define serve_task = 
    #!/bin/bash
    sigint_handler()
    {
        kill $PID
        exit
    }

    trap sigint_handler INT TERM KILL

    while true; do
				make run &
        PID=$!
				# --excludei "build/**/*"
        inotifywait -e modify -e move -e delete -r "$(pwd)/src" > /dev/null 2>&1
        kill $PID
    done
endef

run:
	deno --unstable run ${CONFIG_FLAGS} ${PERMISSION_FLAGS} src/main.ts

serve:
	@$(value serve_task)
	
cleanup:
	echo "Cleanup"

.PHONY: serve dev cleanup
.ONESHELL: