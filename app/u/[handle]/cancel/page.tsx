import PublicCancelPage from "@/features/booking/components/PublicCancelPage";

type Props = {
  params: { handle: string };
};

export default function Page({ params }: Props) {
  return <PublicCancelPage handle={params.handle} />;
}
