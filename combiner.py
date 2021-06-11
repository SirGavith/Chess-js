import os

#find dir
dir = os.path.dirname(__file__)
srcdir = dir + '/src'

#very nice function
open(dir + "/out.js", "w").write("\n\n".join(
    [open(srcdir + "\\" + f, "r").read() for f in os.listdir(srcdir)]))
