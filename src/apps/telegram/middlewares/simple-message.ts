import { getTelegramMessager } from "@src/apps/telegram/utils";
import db from "@src/db";
import MessagerRepository from "@src/repository/messager-repository";
import { Update, User } from "node-telegram-bot-api";

async function simpleMessageMiddleware(update: Update) {
  const tgUser: User = update?.message?.from || null;
  const tgChannel =
    update?.message?.chat?.type == "supergroup" ? update.message.chat : null;
  const tgChat =
    update?.message?.chat?.type == "private" ? update.message.chat : null;

  if (!tgUser) {
    return;
  }
  const messager = await getTelegramMessager();

  const mUserRep = new MessagerRepository(db.messagerUser, messager);
  const mUser = await mUserRep.upsert({
    where: {
      uid_messagerId: { uid: tgUser.id.toString(), messagerId: messager.id },
    },
    create: {
      uid: tgUser.id.toString(),
      user: { create: { username: tgUser.id.toString() } },
      username: tgUser.username,
      fullName:
        tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ""),
    },
    update: {
      username: tgUser.username,
      fullName:
        tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ""),
    },
  });
  if (tgChat) {
    const mChatRep = new MessagerRepository(db.messagerChat, messager);
    await mChatRep.upsert({
      where: {
        uid_messagerId: {
          uid: tgChat.id.toString(),
          messagerId: messager.id,
        },
      },
      create: {
        uid: tgChat.id.toString(),
        messagerUser: {
          connect: {
            id: mUser.id,
          },
        },
      },
    });
  }

  if (tgChannel) {
    const mChannelRep = new MessagerRepository(db.messagerChannel, messager);
    const mChannel = await mChannelRep.upsert({
      where: {
        uid_messagerId: {
          uid: tgChannel.id.toString(),
          messagerId: messager.id,
        },
      },
      create: { uid: tgChannel.id.toString(), name: tgChannel.title },
      update: { uid: tgChannel.id.toString(), name: tgChannel.title },
    });

    await mUserRep.update({
      where: {
        uid_messagerId: { uid: tgUser.id.toString(), messagerId: messager.id },
      },
      data: {
        channels: {
          connectOrCreate: {
            where: {
              messagerUserId_messagerChannelId: {
                messagerUserId: mUser.id,
                messagerChannelId: mChannel.id,
              },
            },
            create: {
              messagerChannelId: mChannel.id,
            },
          },
        },
      },
    });
  }

  return update;
}

export default simpleMessageMiddleware;
