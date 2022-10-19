import db from "../../../../prisma/db.js";
import MessagerRepository from "../../../repository/messager-repository.js";

function splitMessageToEntities(update) {
  return {
    tgUser: update.message.from,
    tgChannel: update.message.chat.type == "group" ? update.message.chat : null,
    tgChat: update.message.chat.type == "private" ? update.message.chat : null,
  };
}

async function simpleMessageMiddleware(prisma, update) {
  try {
    const { tgUser, tgChannel, tgChat } = splitMessageToEntities(update);
  } catch {
    return 
  }
  
  if (!tgUser) {
    return;
  }
  const messager = await db.messager.findUnique({
    where: { code: "telegram" },
  });

  const mUserRep = new MessagerRepository(prisma.messagerUser, messager);
  const mUser = await mUserRep.upsert({
    where: {
      uid_messagerId: { uid: tgUser.username, messagerId: messager.id },
    },
    create: {
      uid: tgUser.username,
      user: { create: { username: tgUser.username } },
    },
  });
  if (tgChat) {
    const mChatRep = new MessagerRepository(prisma.messagerChat, messager);
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
    const mChannelRep = new MessagerRepository(
      prisma.messagerChannel,
      messager
    );
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
        uid_messagerId: { uid: tgUser.username, messagerId: messager.id },
      },
      data: {
        channels: {
          connect: {
            messagerUserId_messagerChannelId: {
              messagerUserId: mUser.id,
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
