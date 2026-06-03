import { prisma } from "@/lib/db"

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    })
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  return createNotification(userId, title, message, type, link)
}

export async function notifyAdmins(
  title: string,
  message: string,
  type: string,
  link?: string
) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    })

    const promises = admins.map((admin) =>
      createNotification(admin.id, title, message, type, link)
    )

    await Promise.all(promises)
  } catch (error) {
    console.error("Error notifying admins:", error)
  }
}
