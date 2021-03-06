const jwt = require("jsonwebtoken");
const moment = require("moment");
const { User, Message, Channel } = require("../mongoose/schema");
const { notAuthenticated } = require("./respones");
const resolvers = {
  User: {
    messages: async (parent, { skip = 0, limit = 20 }) => {
      limit = Math.min(20, limit);
      const messages = await Message.find({ author: parent._id })
        .skip(skip)
        .limit(limit);
      return messages;
    },
  },
  Message: {
    author: async (parent) => {
      const user = await User.findById(parent.author);
      return user;
    },
  },
  Query: {
    me: async (parent, {}, context, info) => {
      const userId = context.userId;
      const user = await User.findById(userId);
      return user;
    },
    myChannels: async (parent, { limit, offset }, context, info) => {
      const userId = context.userId;
      let count = await Message.find({
        participant: {
          $in: [userId],
        },
      }).count();

      const skiped = offset ? offset : count - limit <= 0 ? 0 : count - limit;
      const channels = await Channel.find({
        participant: {
          $in: [userId],
        },
      })
        .populate("participant")
        .populate("messages")
        .skip(skiped)
        .limit(limit);
      // console.log(channels);
      return channels;
    },
    channels: async (parent, { parId, offset, limit }, context, info) => {
      const channels = await Channel.find({
        participant: {
          $in: [parId],
        },
      }).populate("participant");
      return channels;
    },
    messagesOnChannel: async (
      parent,
      { channelId, offset, limit },
      context,
      info
    ) => {
      // Max limit equal 20 messages
      limit = Math.min(20, limit);
      let count = await Message.find({ channel: channelId }).count();

      const skiped = offset ? offset : count - limit <= 0 ? 0 : count - limit;
      const messages = await Message.find({ channel: channelId })
        .skip(skiped)
        .limit(limit);
      console.log(messages[0].author);
      return messages;
      // return {
      //   info: {
      //     count,
      //   },
      //   messages,
      // };
    },
    channel: async (parent, { id }, context, info) => {
      const { userId } = jwt.verify(
        context.authorization,
        process.env.MY_SECRET
      );
      const channel = await Channel.findById(id).populate(
        "messages participant"
      );
      if (channel.messages.indexOf(userId)) {
        return channel;
      }
      return [];
    },
    user: async (parent, { id }) => {
      const user = await User.findById(id);
      return user;
    },

    announcement: () =>
      `Say hello to the new Apollo Server! A production ready GraphQL server with an incredible getting started experience.`,
  },
  Mutation: {
    signup: async (parent, { email, password }, context) => {
      let user = await User.findOne({ email });
      if (user) {
        return {
          error: "Email is taken",
          messages: "Please take an other email.",
        };
      } else {
        user = await new User({ email, password }).save();
        return {
          error: "",
          messages: "Success. You can login with your new account",
        };
      }
    },
    login: async (parent, { email, password }, context) => {
      try {
        const user = await User.findOne({ email }, "password");
        if (user) {
          if (user.password === password) {
            const token = jwt.sign(
              { userId: user._id, username: user.username },
              process.env.MY_SECRET
            );
            return {
              token,
              error: "",
            };
          } else {
            const response = {
              error: "Not authenticated.",
              token: "",
            };
            return notAuthenticated(response);
          }
        } else {
          return {
            error: "Email is not existed",
            token: "",
          };
        }
      } catch (error) {
        return error;
      }
    },
    sendMessage: async (parent, { text, channel }, context, info) => {
      console.log(context);
      try {
        const message = await Channel.sendMessage({
          channel,
          text,
          author: context.userId,
          createdAt: moment(),
          lastSeen: undefined,
        });
        // Pubsub message to the channel.
        context.pubsub.publish("NEW_MESSAGE", { newMessageOnChannel: message });
        return message;
      } catch (error) {
        return error;
      }
    },
  },
  Subscription: {
    hello: {
      subscribe: (parent, args, context) => {
        return context.pubsub.asyncIterator(["hello"]);
      },
    },
    newMessageOnChannel: {
      subscribe: (parent, args, context) => {
        const authenticated = context.userId;
        if (!authenticated) {
          return {
            error: "Not authentication",
          };
        }
        return context.pubsub.asyncIterator(["NEW_MESSAGE"]);
      },
    },
  },
};

module.exports = resolvers;
