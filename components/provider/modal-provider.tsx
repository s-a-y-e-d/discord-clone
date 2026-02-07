'use client'
import CreateServerModal from "@/components/modals/create-server-modal"
import { InviteModal } from "@/components/modals/invite-modal"
import UpdateServerModal from "../modals/update-server-modal"
import MembersModal from "../modals/members-modal";

import LeaveServerModal from "../modals/leave-server-modal";
import DeleteServerModal from "../modals/delete-server-modal";

import CreateChannelModal from "@/components/modals/create-channel-modal";
import { DeleteChannelModal } from "@/components/modals/delete-channel-modal";
import { EditChannelModal } from "@/components/modals/edit-channel-modal";

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
      <DeleteChannelModal />
      <EditChannelModal />
    </>
  )
}
