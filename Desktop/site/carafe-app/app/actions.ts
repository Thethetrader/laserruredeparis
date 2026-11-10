"use server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function revalidateLayoutCache() {
  revalidateTag("layout-user-data");
  revalidatePath("/", "layout");
}
