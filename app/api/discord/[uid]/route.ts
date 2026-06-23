// app/api/discord/[uid]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  const { uid } = params;
  const token = process.env.DISCORD_TOKEN; // Fetches securely from your server env

  if (!token) {
    // If Bot Token is missing, fallback gracefully to a public proxy endpoint
    try {
      const fallbackRes = await fetch(`https://discord-lookup.combobot.app/user/${uid}`);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return NextResponse.json({
          username: data.username,
          global_name: data.global_name || data.username
        });
      }
    } catch {}

    return NextResponse.json(
      { error: 'Server DISCORD_TOKEN is missing and fallback failed.' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/users/${uid}`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
      next: { revalidate: 3600 } // Cache results for 1 hour to reduce API load
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Discord API returned status: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      username: data.username,
      global_name: data.global_name || data.username,
      avatar: data.avatar
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}