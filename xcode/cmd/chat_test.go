package cmd

import (
	"bytes"
	"strings"
	"testing"
)

func TestChatCmd(t *testing.T) {
	// Redirect stdout to a buffer
	buf := new(bytes.Buffer)
	rootCmd.SetOut(buf)

	// Execute the command
	rootCmd.SetArgs([]string{"chat", "hello"})
	err := rootCmd.Execute()
	if err != nil {
		t.Fatalf("rootCmd.Execute() failed: %v", err)
	}

	// Get the output
	output := buf.String()

	// Check if the output contains the expected strings
	expectedUser := "You: hello"
	expectedAI := "AI: This is a simulated AI response."

	if !strings.Contains(output, expectedUser) {
		t.Errorf("Expected output to contain '%s', but got '%s'", expectedUser, output)
	}

	if !strings.Contains(output, expectedAI) {
		t.Errorf("Expected output to contain '%s', but got '%s'", expectedAI, output)
	}
}