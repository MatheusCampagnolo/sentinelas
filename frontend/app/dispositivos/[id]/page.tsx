import { DeviceDetail } from "@/components/device-detail";

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeviceDetail id={decodeURIComponent(id)} />;
}
