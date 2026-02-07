'use client'
import CreateServerModal from "@/components/modals/create-server-modal"
import { InviteModal } from "@/components/modals/invite-modal"

export default function ModalProvider() {
  return (
    <>
      <CreateServerModal />
      <InviteModal />
    </>
  )
}
