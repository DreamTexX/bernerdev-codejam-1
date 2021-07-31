import { App } from "./app.ts";
import { Ban } from "./ban.ts";
import { CustomResponse } from "./context.ts";
import { Context } from "./context.ts";
import { hash } from "./crypto.ts";
import { Session } from "./session.ts";
import { User } from "./user.ts";

function isAuthenticated(ctx: Context): boolean {
  const token = ctx.cookies.get("stk");
  if (!token) return false;
  if (token === "logged_out") return false;
  const session = Session.findByToken(token);
  if (!session) return false;
  if (new Date(session.validUntil).getTime() < new Date().getTime())
    return false;
  const user = User.findByEmail(session.email);
  ctx.user = user;
  return true;
}

new App()
  .get("/", (ctx: Context): CustomResponse => {
    isAuthenticated(ctx);
    return ctx.response.render("index", {
      user: ctx.user,
      banned: Ban.isBanned(ctx.ip)
    });
  })
  .get("/logout", (ctx: Context): CustomResponse => {
    const token = ctx.cookies.get("stk");
    if (token) {
      const session = Session.findByToken(token);
      if (session) {
        Session.destroy(session);
      }
    }

    return ctx.response
      .cookie("stk", "logged_out", {
        expires: new Date(0),
      })
      .redirect("/");
  })
  .post("/login", async (ctx: Context): Promise<CustomResponse> => {
    if (isAuthenticated(ctx)) return ctx.response.redirect("/");
    if (Ban.isBanned(ctx.ip))
      return ctx.response.redirect("/?scope=welcome&error=blocked")
    
    const body: FormData = await ctx.request.formData();
    const email = body.get("email") as string | undefined;
    const password = body.get("password") as string | undefined;
    
    if (!email || !password || email.trim().length === 0 || password.trim().length === 0)
      return ctx.response.redirect("/?scope=login&error=missing_information");
    const user = User.findByEmail(email);
    if (!user || user.password !== (await hash(password))) {
      Ban.fail(ctx.ip);
      return ctx.response.redirect("/?scope=login&field=email&error=combination_not_found")
    }

    const session = await Session.create(user);
    return ctx.response
      .cookie("stk", session.token, {
        expires: session.validUntil,
        httpOnly: true,
        sameSite: "Strict",
        path: "/",
      })
      .redirect("/");
  })
  .post("/register", async (ctx: Context): Promise<CustomResponse> => {
    if (isAuthenticated(ctx)) return ctx.response.redirect("/");
    if (Ban.isBanned(ctx.ip))
      return ctx.response.redirect("/?scope=welcome&error=blocked")
    
    const body: FormData = await ctx.request.formData();
    const email = body.get("email") as string | undefined;
    const password = body.get("password") as string | undefined;
    const passwordConfirm = body.get("password-confirm") as string | undefined;
    
    if (!email || !password || !passwordConfirm || email.trim().length === 0 || password.trim().length === 0 || passwordConfirm.trim().length === 0)
      return ctx.response.redirect("/?scope=register&error=missing_information");

    if (password !== passwordConfirm)
      return ctx.response.redirect("/?scope=register&error=unmatching_passwords");

    if (User.findByEmail(email))
      return ctx.response.redirect("/?scope=register&error=already_in_use");

    const user = await User.create(email, password);
    const session = await Session.create(user);
    return ctx.response
      .cookie("stk", session.token, {
        expires: session.validUntil,
        httpOnly: true,
        sameSite: "Strict",
        path: "/",
      })
      .redirect("/");
  })
  .start();
console.log("Application started");
