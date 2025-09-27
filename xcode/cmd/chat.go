/*
Copyright © 2025 Your Name <youremail@example.com>
*/
package cmd

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"
)

// chatCmd represents the chat command
var chatCmd = &cobra.Command{
	Use:   "chat [message]",
	Short: "Chat with the AI",
	Long: `Starts a chat session with the AI.
Pass your message as an argument. For example:

xcode chat "Hello, world!"`,
	Args: cobra.MinimumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		userMessage := strings.Join(args, " ")
		fmt.Fprintf(cmd.OutOrStdout(), "You: %s\n", userMessage)

		// Simulate AI response
		aiResponse := "This is a simulated AI response."
		fmt.Fprintf(cmd.OutOrStdout(), "AI: %s\n", aiResponse)
	},
}

func init() {
	rootCmd.AddCommand(chatCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// chatCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// chatCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}