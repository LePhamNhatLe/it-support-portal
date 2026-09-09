(function () {
    const USERS = {
        lead: {
            email: "lead@itsupport.local",
            name: "Nguyễn Văn An",
            role: "technical_lead"
        },
        technician: {
            email: "technician@itsupport.local",
            name: "Trần Văn Bình",
            role: "technician"
        },
        user: {
            email: "user@itsupport.local",
            name: "Lê Minh Anh",
            role: "user"
        }
    };

    function setCurrentUser(user) {
        window.localStorage.setItem("currentUser", JSON.stringify(user));
    }

    function restoreRawValue(key, rawValue) {
        if (rawValue === null) {
            window.localStorage.removeItem(key);
            return;
        }

        window.localStorage.setItem(key, rawValue);
    }

    function findTemporaryTicketId() {
        const existingIds = new Set(
            window.TicketStorage.getTickets()
                .filter(function (ticket) {
                    return ticket && typeof ticket.id === "string";
                })
                .map(function (ticket) {
                    return ticket.id;
                })
        );

        for (let number = 990000; number <= 999999; number += 1) {
            const id = "TKT-" + String(number);

            if (!existingIds.has(id)) {
                return id;
            }
        }

        return null;
    }

    function createReporter() {
        const results = [];

        function check(name, condition, details) {
            results.push({
                test: name,
                pass: Boolean(condition),
                details: details || ""
            });
        }

        return {
            results,
            check
        };
    }

    function refreshPageData() {
        if (
            window.TicketsPage &&
            typeof window.TicketsPage.renderTicketList === "function"
        ) {
            window.TicketsPage.renderTicketList();
        }

        if (
            window.TicketsIntegration &&
            typeof window.TicketsIntegration.renderTicketSummary === "function"
        ) {
            window.TicketsIntegration.renderTicketSummary();
        }
    }

    function run() {
        const requiredModules = [
            "TicketStorage",
            "TicketAccess",
            "TicketActionPermissions",
            "TicketOperations",
            "TicketActivity"
        ];
        const missingModules = requiredModules.filter(function (name) {
            return !window[name];
        });

        if (missingModules.length > 0) {
            return {
                ok: false,
                reason: "missing_modules",
                missingModules,
                results: []
            };
        }

        const snapshot = {
            tickets: window.localStorage.getItem("tickets"),
            activities: window.localStorage.getItem("ticketActivities"),
            currentUser: window.localStorage.getItem("currentUser")
        };
        const reporter = createReporter();
        const ticketId = findTemporaryTicketId();

        if (!ticketId) {
            return {
                ok: false,
                reason: "no_test_ticket_id",
                results: []
            };
        }

        try {
            const now = new Date().toISOString();

            setCurrentUser(USERS.user);

            const createResult = window.TicketOperations.createTicket({
                id: ticketId,
                title: "Regression test ticket",
                description: "Phiếu tạm dùng để kiểm tra toàn bộ luồng ticket.",
                category: "network",
                priority: "medium",
                status: "open",
                requesterEmail: USERS.user.email,
                assigneeEmail: null,
                deviceId: null,
                createdAt: now,
                updatedAt: now,
                resolvedAt: null
            });

            reporter.check(
                "User tạo ticket",
                createResult.ok && createResult.data && createResult.data.status === "open",
                createResult.reason || ""
            );

            const createdHistory = window.TicketActivity.getHistory(ticketId);
            reporter.check(
                "Tạo ticket ghi system history",
                createdHistory.some(function (item) {
                    return item.metadata && item.metadata.action === "created";
                })
            );

            const userAssignResult = window.TicketOperations.assignTicket(
                ticketId,
                USERS.technician.email
            );
            reporter.check(
                "User không được phân công",
                !userAssignResult.ok && userAssignResult.reason === "forbidden",
                userAssignResult.reason || ""
            );

            const userWorkNote = window.TicketActivity.addWorkNote(
                ticketId,
                "User không được phép ghi work note."
            );
            reporter.check(
                "User không được thêm work note",
                userWorkNote === null
            );

            setCurrentUser(USERS.lead);

            reporter.check(
                "Lead xem được ticket",
                Boolean(window.TicketAccess.getVisibleTicketById(ticketId))
            );

            const assignResult = window.TicketOperations.assignTicket(
                ticketId,
                USERS.technician.email
            );
            reporter.check(
                "Lead phân công technician",
                assignResult.ok &&
                    assignResult.data &&
                    assignResult.data.assigneeEmail === USERS.technician.email &&
                    assignResult.data.status === "assigned",
                assignResult.reason || ""
            );

            setCurrentUser(USERS.technician);

            reporter.check(
                "Technician thấy ticket được giao",
                Boolean(window.TicketAccess.getVisibleTicketById(ticketId))
            );

            const updateResult = window.TicketOperations.updateTicket(ticketId, {
                priority: "high"
            });
            reporter.check(
                "Technician cập nhật ticket được giao",
                updateResult.ok && updateResult.data && updateResult.data.priority === "high",
                updateResult.reason || ""
            );

            const inProgressResult = window.TicketOperations.changeTicketStatus(
                ticketId,
                "in_progress"
            );
            reporter.check(
                "Technician chuyển assigned → in_progress",
                inProgressResult.ok &&
                    inProgressResult.data &&
                    inProgressResult.data.status === "in_progress",
                inProgressResult.reason || ""
            );

            const comment = window.TicketActivity.addComment(
                ticketId,
                "Regression comment"
            );
            reporter.check("Technician thêm comment", Boolean(comment));

            const workNote = window.TicketActivity.addWorkNote(
                ticketId,
                "Regression work note"
            );
            reporter.check("Technician thêm work note", Boolean(workNote));

            const pendingResult = window.TicketOperations.changeTicketStatus(
                ticketId,
                "pending"
            );
            reporter.check(
                "Technician chuyển in_progress → pending",
                pendingResult.ok && pendingResult.data.status === "pending",
                pendingResult.reason || ""
            );

            const resumeResult = window.TicketOperations.changeTicketStatus(
                ticketId,
                "in_progress"
            );
            reporter.check(
                "Technician chuyển pending → in_progress",
                resumeResult.ok && resumeResult.data.status === "in_progress",
                resumeResult.reason || ""
            );

            const resolvedResult = window.TicketOperations.changeTicketStatus(
                ticketId,
                "resolved"
            );
            reporter.check(
                "Technician resolve ticket",
                resolvedResult.ok &&
                    resolvedResult.data.status === "resolved" &&
                    typeof resolvedResult.data.resolvedAt === "string",
                resolvedResult.reason || ""
            );

            setCurrentUser(USERS.lead);

            const closeResult = window.TicketOperations.changeTicketStatus(
                ticketId,
                "closed"
            );
            reporter.check(
                "Lead đóng ticket",
                closeResult.ok && closeResult.data.status === "closed",
                closeResult.reason || ""
            );

            const reopenResult = window.TicketOperations.changeTicketStatus(
                ticketId,
                "reopened"
            );
            reporter.check(
                "Lead mở lại ticket",
                reopenResult.ok &&
                    reopenResult.data.status === "reopened" &&
                    reopenResult.data.resolvedAt === null,
                reopenResult.reason || ""
            );

            const history = window.TicketActivity.getHistory(ticketId);
            const actions = history
                .map(function (item) {
                    return item && item.metadata ? item.metadata.action : null;
                })
                .filter(Boolean);

            reporter.check(
                "History có create / assign / update / status",
                actions.includes("created") &&
                    actions.includes("assigned") &&
                    actions.includes("updated") &&
                    actions.includes("status_changed"),
                actions.join(", ")
            );

            reporter.check(
                "Comment được lưu riêng",
                window.TicketActivity.getComments(ticketId).length === 1
            );
            reporter.check(
                "Work note xuất hiện trong history",
                window.TicketActivity.getWorkNotes(ticketId).length === 1 &&
                    history.some(function (item) {
                        return item.type === "work_note";
                    })
            );
        } catch (error) {
            reporter.check(
                "Regression runner không phát sinh exception",
                false,
                error && error.message ? error.message : String(error)
            );
        } finally {
            restoreRawValue("tickets", snapshot.tickets);
            restoreRawValue("ticketActivities", snapshot.activities);
            restoreRawValue("currentUser", snapshot.currentUser);
            refreshPageData();
        }

        const passed = reporter.results.filter(function (item) {
            return item.pass;
        }).length;
        const failed = reporter.results.length - passed;
        const report = {
            ok: failed === 0,
            passed,
            failed,
            total: reporter.results.length,
            results: reporter.results
        };

        if (typeof console.table === "function") {
            console.table(reporter.results);
        }

        console.log(
            "Ticket regression:",
            report.ok ? "PASS" : "FAIL",
            passed + "/" + reporter.results.length
        );

        return report;
    }

    window.TicketRegression = {
        run
    };
})();
