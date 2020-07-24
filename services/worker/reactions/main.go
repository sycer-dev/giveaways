package main

import (
	"encoding/json"
	"log"
	"os"

	"github.com/machinebox/graphql"
	"github.com/spec-tacles/go/broker"
	"github.com/spec-tacles/go/rest"
	"github.com/spec-tacles/go/types"
	"golang.org/x/net/context"
)

var (
	gql     = graphql.NewClient("http://localhost:4000/graphql")
	discord = rest.NewClient(os.Getenv("DISCORD_TOKEN"))
	events  = []string{"MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"}
)

var create = graphql.NewRequest(`
	mutation($user_id: String!, $message_id: String!) {
		createEntry(data: {
			user_id: $user_id,
			message_id: $message_id
		}) {
			id
		}
	}
`)

// CreateEntry represents the created giveaway entry
type CreateEntry struct {
	CreateEntry struct {
		ID int32
	}
}

var delete = graphql.NewRequest(`
	query($user_id: String!, $message_id: String!) {
		deleteEntry(user_id: $user_id, message_id: $message_id)
	}
`)

// DeleteEntry represents the created giveaway entry
type DeleteEntry struct {
	DeleteEntry struct{}
}

// GatewayEmoji represents a gateway emoji
type GatewayEmoji struct {
	ID       *string `json:"id"`
	Name     *string `json:"name"`
	Animated *bool   `json:"animated"`
}

// MessageReactionAdd represents a message reaction add
type MessageReactionAdd struct {
	UserID    string             `json:"user_id"`
	ChannelID string             `json:"channel_id"`
	MessageID string             `json:"message_id"`
	GuildID   string             `json:"guild_id"`
	Member    *types.GuildMember `json:"member"`
	Emoji     GatewayEmoji       `json:"emoji"`
}

// MessageReactionRemove represents a message reaction add
type MessageReactionRemove struct {
	UserID    string       `json:"user_id"`
	ChannelID string       `json:"channel_id"`
	MessageID string       `json:"message_id"`
	GuildID   string       `json:"guild_id"`
	Emoji     GatewayEmoji `json:"emoji"`
}

func main() {
	amqp := broker.NewAMQP("gateway", "", ingest)

	err := amqp.Connect("amqp://fyko:doctordoctor@localhost//")
	if err != nil {
		log.Fatalf("An error occurred when trying to connect to RabbtiMQ: %+v", err)
	}

	for _, event := range events {
		go func(event string) {
			err := amqp.Subscribe(event)

			if err != nil {
				log.Fatalf("An error occurred when trying to listen to event '%+s': %+v", event, err)
			}
		}(event)

		log.Printf("Successfully subscribed to event '%+s'", event)
	}

	select {}
}

func ingest(event string, bytes []byte) {
	if event == "MESSAGE_REACTION_ADD" {
		data := &MessageReactionAdd{}
		err := json.Unmarshal(bytes, &data)

		if err != nil {
			log.Printf("Error when unmarshalling MESSAGE_REACTION_ADD data: %v", err)
			return
		}

		handleAdd(data)
	}

	if event == "MESSAGE_REACTION_REMOVE" {
		data := &MessageReactionRemove{}

		err := json.Unmarshal(bytes, &data)

		if err != nil {
			log.Printf("Error when unmarshalling MESSAGE_REACTION_REMOVE data: %v", err)
			return
		}

		handleRemove(data)
	}
}

func handleAdd(data *MessageReactionAdd) {
	create.Var("user_id", data.UserID)
	create.Var("message_id", data.MessageID)

	var res CreateEntry
	err := gql.Run(context.Background(), create, &res)

	if err != nil {
		log.Printf("Error when creating a giveaway entry: %v", err)
		return
	}

	log.Println(res.CreateEntry)
}

func handleRemove(data *MessageReactionRemove) {
	delete.Var("user_id", data.UserID)
	delete.Var("message_id", data.MessageID)

	var res DeleteEntry
	err := gql.Run(context.Background(), delete, &res)

	if err != nil {
		log.Printf("Error when deleting a giveaway entry: %v", err)
		return
	}

	log.Println(res.DeleteEntry)
}
