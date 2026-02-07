'use client'
import CreateServerModal from "@/components/modals/create-server-modal"
import { InviteModal } from "@/components/modals/invite-modal"
import UpdateServerModal from "../modals/update-server-modal"
import MembersModal from "../modals/members-modal";

import LeaveServerModal from "../modals/leave-server-modal";
import DeleteServerModal from "../modals/delete-server-modal";

import CreateChannelModal from "@/components/modals/create-channel-modal";

export default function ModalProvider() {
  return (
    <>
      <CreateServerModal />
      <InviteModal />
      <UpdateServerModal />
      <MembersModal />
      <CreateChannelModal />
      <LeaveServerModal />
      <DeleteServerModal />
    </>
  )
}
