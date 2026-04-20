//go:build js && wasm
package main

import (
	"fmt"
	"syscall/js"
)

var (
	version = "1.0.4"
	status  = "idle"
)

func main() {
	fmt.Printf("Volt Engine v%s Initializing...\n", version)

	// Expose functions to JS
	js.Global().Set("volt_getStats", js.FuncOf(getStats))
	js.Global().Set("volt_renderFrame", js.FuncOf(renderFrame))
	js.Global().Set("volt_processClip", js.FuncOf(processClip))

	fmt.Println("Volt Engine Ready.")
	status = "active"

	// Keep the Go program running
	select {}
}

func getStats(this js.Value, args []js.Value) interface{} {
	stats := map[string]interface{}{
		"version": version,
		"status":  status,
		"memory":  "64 MB", // Mock data for now
		"threads": 4,       // Mock data for now
	}
	return stats
}

func renderFrame(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return "Error: Missing frame index"
	}
	frameIdx := args[0].Int()
	// Logic for rendering frame goes here
	return fmt.Sprintf("Rendered frame %d", frameIdx)
}

func processClip(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return "Error: Missing clip data"
	}
	clipName := args[0].String()
	return fmt.Sprintf("Processed clip: %s", clipName)
}
