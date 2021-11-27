from __future__ import unicode_literals

import json
import datetime

from django.template.defaultfilters import escape

from program.models import Program
from notification.models import Notif
from ourjseditor import api
from .models import Comment


# /program/PRO_ID/comment/new
@api.StandardAPIErrors("POST")
@api.login_required
def new_comment(request, program_id):
    data = json.loads(request.body)

    program = Program.objects.get(program_id=program_id)
    if not program.can_user_view(request.user):
        return api.error("Not authorized.", status=401)

    # A JSON of `null` gets parsed into a Python of `None`
    # If parent isn't passed, KeyError, caught by StandardAPIErrors
    parent_comment = data["parent"]
    if parent_comment is None:
        depth = 0
    else:
        try:
            parent_comment = Comment.objects.get(comment_id=parent_comment, program_id=program_id)
        except Comment.DoesNotExist:
            return api.error("Invalid comment parent")
        depth = parent_comment.depth + 1

    if depth > 1:
        return api.error("Comments have gone too deep!")

    if parent_comment is not None:
        parent_comment.reply_count += 1
        parent_comment.save()

    created_comment = Comment.objects.create(
        user=request.user,
        program=program,
        parent=parent_comment,
        depth=depth,
        content=data["content"],
        original_content=data["content"],
    )

    link = "/program/{0}#comment-{1}".format(created_comment.program.program_id, created_comment.comment_id)

    if depth == 0:
        if program.user != created_comment.user:
            Notif.objects.create(
                target_user=program.user,
                link=link,
                description="<strong>{0}</strong> left a comment on your program, <strong>{1}</strong>".format(
                    escape(request.user.profile.display_name), escape(program.title)
                ),
                source_comment=created_comment
            )
    else:
        # Create a list of everyone in the comment thread and spam them all
        to_notify = set(Comment.objects
            .filter(parent=parent_comment)
            .exclude(user=parent_comment.user) # Not the thread starter, they get a different message
            .exclude(user=created_comment.user) # Not the user who posted this comment
            .values_list("user", flat=True)
        )

        for user in to_notify:
            Notif.objects.create(
                target_user_id=user,
                link=link,
                description="<strong>{0}</strong> commented on a thread on <strong>{1}</strong>".format(
                    escape(request.user.profile.display_name), escape(program.title)
                ),
                source_comment=created_comment
            )

        # Notify the original comment creator separately, if that's not the same person that posted this reply
        if parent_comment.user != created_comment.user:
            Notif.objects.create(
                target_user=parent_comment.user,
                link=link,
                description="<strong>{0}</strong> replied to your comment on <strong>{1}</strong>".format(
                    escape(request.user.profile.display_name), escape(program.title)
                ),
                source_comment=created_comment
            )

    response = api.succeed({"id": created_comment.comment_id}, status=201)
    response["Location"] = link
    return response


# /api/program/PRO_ID/comment/COMMENT_ID
# /api/comment/COMMENT_ID
@api.StandardAPIErrors("GET", "PATCH", "DELETE")
def comment(request, *args):
    if len(args) == 1:
        comment_id = args[0]

        requested_comment = Comment.objects.get(comment_id=comment_id)
    elif len(args) == 2:
        program_id = args[0]
        comment_id = args[1]

        requested_comment = Comment.objects.get(program_id=program_id, comment_id=comment_id)

    program = requested_comment.program
    if not program.can_user_view(request.user):
        return api.error("Not authorized.", status=401)

    if request.method == "GET":
        return api.succeed(requested_comment.to_dict())

    # Comment editing!
    elif request.method == "PATCH":
        data = json.loads(request.body)

        if request.user != requested_comment.user:
            return api.error("Not authorized.", status=401)

        requested_comment.content = data["content"]
        requested_comment.edited = datetime.datetime.now()

        requested_comment.save()

        return api.succeed()
    elif request.method == "DELETE":
        if request.user != requested_comment.user:
            return api.error("Not authorized.", status=401)

        parent = requested_comment.parent
        if parent is not None:
            parent.reply_count -= 1
            parent.save()

        requested_comment.delete()

        return api.succeed()


# Endpoint for what KA calls replies, i.e. comments on comments, i.e. comments with a depth > 0
# Note: POST requests for these are still made to /api/program/PRO_ID/comments, just with "parent": "COMMENT_ID"
# /api/program/PRO_ID/comment/COMMENT_ID/comments
# /api/comment/COMMENT_ID/comments
@api.StandardAPIErrors("GET")
def comment_comments(request, *args):
    if len(args) == 1:
        comment_id = args[0]
    elif len(args) == 2:
        comment_id = args[1]

    # check if the comments are from a private program
    program_of_comments = Comment.objects.get(comment_id=comment_id).program
    if not program_of_comments.can_user_view(request.user):
        return api.error("Not authorized.", status=401)

    if len(args) == 1:
        comments = Comment.objects.select_related("user__profile").filter(parent__comment_id=comment_id).order_by("created")
    elif len(args) == 2:
        program_id = args[0]

        comments = Comment.objects.select_related("user__profile").filter(program_id=program_id, parent__comment_id=comment_id).order_by("created")

    comments = list(comments)
    return api.succeed({
        "comments": [c.to_dict() for c in comments]
    })


# /program/PRO_ID/comments
@api.StandardAPIErrors("GET")
def program_comments(request, program_id):
    program = Program.objects.get(program_id=program_id)
    if not program.can_user_view(request.user):
        return api.error("Not authorized.", status=401)

    comments = list(Comment.objects.select_related("user__profile").filter(program_id=program_id, depth=0).order_by("-created"))
    return api.succeed({
        "comments": [c.to_dict() for c in comments]
    })
